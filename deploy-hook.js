/*
 * Node-deploy-hook
 * --------------------------------------------
 * See config.js for email and port options
 *
*/

var express = require('express'),
    http = require('http'),
    nodemailer = require("nodemailer"),
    childprocess = require("child_process"),
    path = require("path"),

    app = express(),
    config = require('./config'),

    // port can be optionally configured (8888 by default)
    server = http.createServer(app).listen( config.port );



// Allow node to be run with proxy passing
app.enable('trust proxy');

// Logging config
app.configure('local', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function(){
    app.use(express.errorHandler());
});

// Compression (gzip)
app.use( express.compress() );
app.use( express.methodOverride() );
app.use( express.bodyParser() );            // Needed to parse POST data sent as JSON payload


var sendMail = function(message){
    var smtpTransport = nodemailer.createTransport("SMTP", config.email.transport);
    smtpTransport.sendMail({
        from: config.email.from,
        to: config.email.to,
        subject: message.subject,
        text: message.text
    }, function(err, res){
        if(err) console.log((new Date()).toString() + " :: Error sending deployment email:: " + err);
        else console.log((new Date()).toString() + " :: Successfully sent deployment email.");
    });
};

app.all("/deploy", function(req, res){
    var projectDir = path.normalize(req.params.project ? config.serverRoot+req.params.project : __dirname),
        remoteBranch = req.params.remote_branch || 'origin',
        localBranch = req.params.local_branch || 'master',
        deployJSON;

    var deploy = childprocess.exec("cd "+projectDirName+" && git pull "+remoteBranch+" "+localBranch, function(err, stdout, stderr){
        if(err){
            deployJSON = { subject: subjectOnError, message: "Error pulling down remote repository:: \n"+err, error: true  };
            if(config.email.sendOnError) sendMail( deployJSON );
        } else {
            deployJSON = { subject: subjectOnSuccess, message: "Success pulling down remote repository:: \n"+stdout, success: true };
            if(config.email.sendOnSuccess) sendMail( deployJSON );
        }

        res.json( deployJSON );
    });
});

console.log((new Date()).toString()+ ":: Node-deploy-hook server listening on port::", server.address().port, ", environment:: ", app.settings.env);