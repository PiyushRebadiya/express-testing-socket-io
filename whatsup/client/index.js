const { Client, LocalAuth } = require('whatsapp-web.js');

function createClient(clientId) {
    const wwebVersion = '2.2407.3';
    const client = new Client({
        authStrategy: new LocalAuth({ clientId }), // Set clientId dynamically
        puppeteer: {
            // Headless mode configuration or other puppeteer options
        },
        webVersionCache: {
            type: 'remote',
            remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
        },
    });

    // Add event listeners, etc., if needed

    return client;
}

module.exports = {
    createClient
}