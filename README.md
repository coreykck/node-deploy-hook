node-deploy-hook
=======================
A super simple, lightweight Node.JS deployer to be used with Bitbucket or Github POST service hooks

Install
-----------------------
Follow the instructions [here](https://gist.github.com/oodavid/1809044) to set up your remote web-server root, deploy user ssh access, and service hooks.

Add as a proxy to the deployment project's vhost in nginx or apache.
For example in nginx, you could add:

```
    location /deploy/ {
        proxy_pass http://127.0.0.1:8888/deploy?project=MyProjectName&remote_branch=origin&local_branch=master;
    }
```


Run
-----------------------
Start the server as www-data or apache user:

```
cd /var/www/node-deploy-hook
sudo -Hu www-data nohup node deploy-hook.js > ./log/deploy.log 2>&1&
```

Environment variables
-----------------------
To change the branch you want to deploy, use NODE_ENV variable
```
export NODE_ENV=qa; nodejs -i deploy-hook.js
```

Change Log
----------------------
v1.0.1
* Bitbucket hook is now working properly
* Git pull replaced to git reset --hard

