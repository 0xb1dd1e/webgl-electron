const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  const {
    width,
    height
  } = electron.screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width,
    height
  });

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });
}

function hookPowerMonitorEvents() {
  console.log('Set up power monitor events...');

  electron.powerMonitor.on('suspend', (e) => {
    console.log('The system is suspending')
    e.preventDefault();
  });
  electron.powerMonitor.on('resume', (e) => {
    console.log('The system is resuming');
  });
  electron.powerMonitor.on('on-ac', (e) => {
    console.log('The system is going to ac-power');
  });
  electron.powerMonitor.on('on-battery', (e) => {
    console.log('The system is going to battery-power');
  });
  electron.powerMonitor.on('shutdown', (e) =>  {
    console.log('The system is going to shutdown');
  });
}

app.on('gpu-process-crashed', () => {
  console.log('GPU process crashed! Look for the webgl contexts to be restored...');
  //electron.dialog.showErrorBox('GPU has crashed', 'You need to restart!');
});


const enableGPUProcessCrashHandler = true;

if (enableGPUProcessCrashHandler) {
  app.commandLine.appendSwitch('--disable-gpu-process-crash-limit');
  app.disableDomainBlockingFor3DAPIs();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  console.log('app: ready');
  hookPowerMonitorEvents();
  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    console.log('app: activate: createWindow');
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.