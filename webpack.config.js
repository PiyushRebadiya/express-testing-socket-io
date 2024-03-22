const path = require('path');

module.exports = {
    entry: './index.js', // Entry point of your Express application
    target: 'node', // Tell webpack to bundle for Node.js environment
    output: {
        path: path.resolve(__dirname, 'dist'), // Output directory
        filename: 'server.bundle.js' // Output file name
    }
};
