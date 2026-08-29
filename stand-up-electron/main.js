const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const appIconPath = path.join(__dirname, 'assets', 'icon.ico');

let settingsWindow;
let reminderWindow;
let tray;
let countdownTimer;
let quitting = false;

let reminderConfig = {
  minutes: 45,
  mode: 'default'
};

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function normalizeMinutes(minutes) {
  const numericMinutes = Number(minutes);
  if (!Number.isFinite(numericMinutes)) {
    return 45;
  }

  if (numericMinutes <= 1) {
    return 1;
  }

  return Math.min(60, Math.round(numericMinutes / 5) * 5);
}

function normalizeConfig(config) {
  return {
    minutes: normalizeMinutes(config?.minutes),
    mode: config?.mode === 'forced' ? 'forced' : 'default'
  };
}

function loadSettings() {
  try {
    if (!fs.existsSync(getSettingsPath())) {
      return;
    }

    const savedSettings = JSON.parse(fs.readFileSync(getSettingsPath(), 'utf8'));
    reminderConfig = normalizeConfig(savedSettings);
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(reminderConfig, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 420,
    height: 320,
    resizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    icon: appIconPath,
    title: 'Stand Up Reminder',
    backgroundColor: '#f7f7f2',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile('index.html');
  settingsWindow.setMenuBarVisibility(false);

  settingsWindow.on('close', (event) => {
    if (!quitting) {
      event.preventDefault();
      settingsWindow.hide();
    }
  });

  settingsWindow.on('minimize', (event) => {
    event.preventDefault();
    settingsWindow.hide();
  });
}

function createTray() {
  tray = new Tray(appIconPath);
  tray.setToolTip('Stand Up Reminder');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Settings', click: showSettingsWindow },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          quitting = true;
          app.quit();
        }
      }
    ])
  );
  tray.on('click', showSettingsWindow);
}

function showSettingsWindow() {
  if (!settingsWindow) {
    createSettingsWindow();
  }

  settingsWindow.show();
  settingsWindow.focus();
  settingsWindow.webContents.send('settings:sync', reminderConfig);
}

function startCountdown(config) {
  reminderConfig = normalizeConfig(config);
  saveSettings();

  clearTimeout(countdownTimer);

  const delayMs = reminderConfig.minutes * 60 * 1000;
  countdownTimer = setTimeout(showReminderWindow, delayMs);

  if (settingsWindow) {
    settingsWindow.hide();
  }
}

function getReminderBounds(mode) {
  const display = screen.getPrimaryDisplay();
  const workArea = display.workArea;

  if (mode === 'forced') {
    const width = Math.round(workArea.width * 0.6);
    const height = 96;
    return {
      width,
      height,
      x: workArea.x + Math.round((workArea.width - width) / 2),
      y: workArea.y + Math.round((workArea.height - height) / 2)
    };
  }

  const width = 440;
  const height = 88;
  return {
    width,
    height,
    x: workArea.x + workArea.width - width - 24,
    y: workArea.y + 24
  };
}

function showReminderWindow() {
  const bounds = getReminderBounds(reminderConfig.mode);

  function presentReminder() {
    reminderWindow.show();
    reminderWindow.focus();
    reminderWindow.webContents.send('reminder:start');
  }

  if (!reminderWindow) {
    reminderWindow = new BrowserWindow({
      ...bounds,
      show: false,
      frame: false,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      icon: appIconPath,
      backgroundColor: '#ffffff',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    reminderWindow.loadFile('reminder.html');
    reminderWindow.on('closed', () => {
      reminderWindow = null;
    });
    reminderWindow.webContents.once('did-finish-load', presentReminder);
  } else {
    reminderWindow.setBounds(bounds);
    presentReminder();
  }
}

ipcMain.handle('settings:get', () => reminderConfig);

ipcMain.on('timer:start', (_event, config) => {
  startCountdown(config);
});

ipcMain.on('reminder:ok', () => {
  if (reminderWindow) {
    reminderWindow.hide();
  }
  startCountdown(reminderConfig);
});

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', showSettingsWindow);

  app.whenReady().then(() => {
    loadSettings();
    Menu.setApplicationMenu(null);
    createTray();
    createSettingsWindow();

    app.on('activate', showSettingsWindow);
  });
}

app.on('window-all-closed', () => {});

app.on('before-quit', () => {
  quitting = true;
  clearTimeout(countdownTimer);
});
