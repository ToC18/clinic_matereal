const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // при разработке — URL Vite dev
  win.loadURL('http://localhost:5173');

  // для production: win.loadFile(path.join(__dirname, '../frontend/dist/index.html'))
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
