module.exports = {
    repo: 'gamemn_gameplaza',
    deployBashScript: '/home/cgrimoldi/deploy.sh',
    notification: {
        sendOnSuccess: true,
        sendOnError: true,
        slackHookUrl: 'https://hooks.slack.com/services/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',
        baseMessage: {
            "username": "The Deployer",
            "icon_url": "https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2015-10-16/12643406144_4857723267bf467300f4_48.jpg",
            "text": "Deploy done"
        }
    },
    port: 8765,
    allowedips: [
        '131.103.20.160/27',
        '165.254.145.0/26',
        '104.192.143.0/24',
        '192.168.56.0/24',
        '127.0.0.1/0',
    ]
};
