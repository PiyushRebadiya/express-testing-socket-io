var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
    name: 'Taxfile Web Socket Node CRM Server',
    description: 'Running Web Socket Node CRM Server Of Taxfile',
    script: 'C:\\inetpub\\wwwroot\\WebSocketServer\\socket-node\\index.js',
    // script: 'C:\\Users\\ARTIS\\Desktop\\express-testing-socket-io\\index.js',
    //, workingDirectory: '...'
    //, allowServiceLogon: true
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();

// // Listen for the "uninstall" event so we know when it's done.
// svc.on('uninstall', function () {
//     console.log('Uninstall complete.');
//     console.log('The service exists: ', svc.exists);
// });

// // Uninstall the service.
// svc.uninstall();

svc.on('error', (error) => {
  console.error('Service error:', error.message);
});

svc.on('start', () => {
  console.log('Service started successfully.');
});
