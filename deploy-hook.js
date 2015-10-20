/*
 * Node-deploy-hook
 * --------------------------------------------
 * See config.js for email and port options
 *
*/

var express = require('express'),
    http = require('http'),
    childprocess = require("child_process"),
    path = require("path"),
    bodyParser = require('body-parser'),
    methodOverride = require("method-override"),
    app = express(),
    config = require('./config'),
    ip = require('ip'),
    server = http.createServer(app).listen( config.port);

var localRepo = config.repo,
    localBranch = app.settings.env;

var writeLog = function (message, type) {
    console.log((new Date()).toString()+ " [" + type + "] " + message);
};

var verifyIP = function (clientIp) {
    var clientIp = ip.toLong(clientIp);
    for (var id in config.allowedips) {
        var allowed = ip.cidrSubnet(config.allowedips[id]);
        if (clientIp >= ip.toLong(allowed.firstAddress) && clientIp <= ip.toLong(allowed.lastAddress)) {
            return true;
        }
    }
    return false;
};

var sendNotification = function(resultJSON){
    var requestify = require('requestify');
    var url = config.notification.slackHookUrl,
        message = config.notification.baseMessage;
    message.text = "*" + resultJSON.branch + "* branch on *" + resultJSON.repo+ "*";
    if (resultJSON.done) {
        message.text = "Deployed " + message.text;
    }
    else {
        message.text = "*ERROR* deploying " + message.text;
    }


    requestify.post(url, message).then(function(response) {
        if (response.statusCode != 200) writeLog("Failed sending notification to Slack with error: " + error, "error");
    });

    return message;
    //call url with message in body
};

if (typeof localRepo == 'undefined' || typeof localBranch == 'undefined' || localRepo.length < 2  || localBranch.length < 2) {
    writeLog("Can't start server; need env vars repo and branch", "critical");
    process.exit();
}
app.enable('trust proxy'); // Allow node to be run with proxy passing

app.use( express.compress() ); // Compression (gzip)
app.use( methodOverride() );
app.use( bodyParser.json() ); // for parsing application/json
app.use( bodyParser.urlencoded({ extended: true }) ); // for parsing application/x-www-form-urlencoded

// Logging config
switch (app.get('env')) {
    case 'qa':
    case 'dev':
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
        break;
    default:
        app.use(express.errorHandler());
}

app.all("/deploy", function(req, res, next){
    var deployJSON, payload, ok, message;
    ok = false;

    if (! verifyIP(req.ip)) {
        writeLog('Call not allowed from ip: ' + req.ip, "notice");
        res.status(403).send('Forbidden')
    }

    if(req.is('json') && req.body)
        payload = req.body;
        if(payload && payload.push){        // POST request made by github service hook, use the repo name
            var pushedRepo = payload.repository.name,
                pushedBranch = payload.push.changes[0].new.name;
            writeLog('push received from ' + pushedRepo + "/" + pushedBranch, "info");
            if (localRepo == pushedRepo && pushedBranch == localBranch) {
                ok = true;
            }
            else {
                writeLog("Notting done because config mismatch", "notice");
                res.status(404).send('Not Found')
            }
        } else {                                                                // Else assume it is this repo or installed here, and was hit directly
            writeLog('Invalid request', "notice");
            writeLog('request: ' + req.body, "debug");
            res.status(404).send('Not Found')
        }

    if(ok) {
        writeLog("Starting deploying branch " + localBranch + " of project " + localRepo, "info");
        var deploy = childprocess.exec(config.deployBashScript + " " + localRepo + " " + localBranch, function(err, stdout, stderr){
            //console.log(deploy, err, stdout, stderr)
            deployJSON = {
                repo: localRepo,
                branch: localBranch,
                std: {
                    status: deploy,
                    error: err,
                    out: stdout,
                    err: stderr,
                },
            };
            if(err){
                deployJSON.done = false;
                if(config.notification.sendOnError) message = sendNotification( deployJSON );
                writeLog("Deploy FAILED with message " + stderr, "error");
            } else {
                deployJSON.done = true;
                if(config.notification.sendOnSuccess) message = sendNotification( deployJSON );
                writeLog("Deploy DONE with message:\n" + stdout, "info");
            }

            res.json( message );
        });
    };
});

writeLog("Node-deploy-hook server listening on port:: " + config.port + ", environment:: " + app.settings.env, "info");
writeLog("Waiting push info for " + localRepo + "/" + localBranch, "info");
