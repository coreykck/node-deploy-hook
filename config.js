module.exports = {
    repo: 'gamemn_gameplaza',
    deployBashScript: '/home/cgrimoldi/deploy.sh',
    notification: {
        sendOnSuccess: false,
        sendOnError: false,
        slackHookUrl: ''
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
