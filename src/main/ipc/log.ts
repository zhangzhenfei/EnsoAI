import path from 'node:path';
import { IPC_CHANNELS } from '@shared/types';
import { app, ipcMain, shell } from 'electron';
import log, { initLogger } from '../utils/logger';

export function registerLogHandlers(): void {
  // Update logging configuration (enabled state and/or level)
  ipcMain.handle(
    IPC_CHANNELS.LOG_UPDATE_CONFIG,
    async (_, config: { enabled: boolean; level: 'error' | 'warn' | 'info' | 'debug' }) => {
      initLogger(config.enabled, config.level);
      log.info(`Logging config updated: enabled=${config.enabled}, level=${config.level}`);
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
