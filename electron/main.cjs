const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;

// Determine storage path in user app data
const userDataPath = app.getPath('userData');
const stateFilePath = path.join(userDataPath, 'hourglass-state.json');

function loadSavedState() {
  try {
    if (fs.existsSync(stateFilePath)) {
      const data = fs.readFileSync(stateFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load saved state:', err);
  }
  return null;
}

function saveState(data) {
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to save state:', err);
    return false;
  }
}

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Windows-specific always-on-top level
  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  // If in development mode with dev server
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
  if (!app.isPackaged) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Create system tray icon
  const iconPath = path.join(__dirname, 'icon.png');
  // Fallback to empty tray if icon file not found
  try {
    tray = new Tray(iconPath);
  } catch {
    // If no png exists yet, create an offscreen native image or skip
    return;
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'New Hourglass',
      click: () => {
        mainWindow?.webContents.send('shortcut:triggered', 'new-hourglass');
      },
    },
    { type: 'separator' },
    {
      label: 'Show All',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('shortcut:triggered', 'show-all');
      },
    },
    {
      label: 'Hide All',
      click: () => {
        mainWindow?.webContents.send('shortcut:triggered', 'hide-all');
      },
    },
    { type: 'separator' },
    {
      label: 'Pause All',
      click: () => {
        mainWindow?.webContents.send('shortcut:triggered', 'pause-all');
      },
    },
    {
      label: 'Resume All',
      click: () => {
        mainWindow?.webContents.send('shortcut:triggered', 'resume-all');
      },
    },
    { type: 'separator' },
    {
      label: 'Exit Hourglass',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Hourglass - Desktop Productivity Timer');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

function registerGlobalShortcuts() {
  // Ctrl + Alt + H: New Hourglass
  globalShortcut.register('CommandOrControl+Alt+H', () => {
    mainWindow?.webContents.send('shortcut:triggered', 'new-hourglass');
  });

  // Ctrl + Alt + P: Pause / Resume active hourglass
  globalShortcut.register('CommandOrControl+Alt+P', () => {
    mainWindow?.webContents.send('shortcut:triggered', 'toggle-pause');
  });
}

app.whenReady().then(() => {
  createMainWindow();
  createTray();
  registerGlobalShortcuts();

  // IPC Handlers
  ipcMain.on('window:set-always-on-top', (_, alwaysOnTop) => {
    mainWindow?.setAlwaysOnTop(alwaysOnTop, 'screen-saver');
  });

  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('storage:save', (_, data) => {
    return saveState(data);
  });

  ipcMain.handle('storage:load', () => {
    return loadSavedState();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
