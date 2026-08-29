const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('standUp', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  startTimer: (config) => ipcRenderer.send('timer:start', config),
  onSettingsSync: (callback) => {
    ipcRenderer.on('settings:sync', (_event, config) => callback(config));
  },
  onReminderStart: (callback) => {
    ipcRenderer.on('reminder:start', callback);
  },
  acknowledgeReminder: () => ipcRenderer.send('reminder:ok')
});
