import path from 'node:path';
import { IPC_CHANNELS } from '@shared/types';
import { app, ipcMain, shell } from 'electron';
import log, { initLogger } from '../utils/logger';
import { readSettings } from './settings';

export function registerLogHandlers(): void {
  // Update logging enabled state
  ipcMain.handle(
    IPC_CHANNELS.LOG_SET_ENABLED,
    async (_, enabled: boolean, level: 'error' | 'warn' | 'info' | 'debug') => {
      initLogger(enabled, level);
      log.info(`Logging ${enabled ? 'enabled' : 'disabled'}`);
    }
  );

  // Update log level
  ipcMain.handle(
    IPC_CHANNELS.LOG_SET_LEVEL,
    async (_, level: 'error' | 'warn' | 'info' | 'debug', enabled: boolean) => {
      initLogger(enabled, level);
      log.info(`Log level changed to: ${level}`);
    }
  );

  // Open log folder
  ipcMain.handle(IPC_CHANNELS.LOG_OPEN_FOLDER, async () => {
    const logDir = app.getPath('logs');
    await shell.openPath(logDir);
  });

  // Get log file path
  ipcMain.handle(IPC_CHANNELS.LOG_GET_PATH, async () => {
    return path.join(app.getPath('logs'), 'ensoai.log');
  });
}
