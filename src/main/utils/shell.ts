/**
 * Shared shell utilities for consistent shell configuration across the app.
 * Reads user's shell config from settings and provides consistent environment.
 */

import type { ShellConfig } from '@shared/types';
import { readSettings } from '../ipc/settings';
import { findLoginShell, getEnhancedPath } from '../services/terminal/PtyManager';
import { shellDetector } from '../services/terminal/ShellDetector';

/**
 * Get shell configuration for executing commands.
 * Uses user's configured shell from settings, falls back to findLoginShell.
 */
export function getShellForCommand(): { shell: string; args: string[] } {
  const settings = readSettings();
  // zustand stores settings under 'enso-settings.state'
  const zustandState = (settings?.['enso-settings'] as { state?: Record<string, unknown> })?.state;
  const shellConfig = zustandState?.shellConfig as ShellConfig | undefined;

  if (shellConfig) {
    const { shell, execArgs } = shellDetector.resolveShellForCommand(shellConfig);
    return { shell, args: execArgs };
  }

  return findLoginShell();
}

/**
 * Get environment variables for executing commands.
 * Includes enhanced PATH and proper locale settings.
 */
export function getEnvForCommand(additionalEnv?: Record<string, string>): Record<string, string> {
  return {
    ...process.env,
    PATH: getEnhancedPath(),
    LANG: process.env.LANG || 'en_US.UTF-8',
    LC_ALL: process.env.LC_ALL || process.env.LANG || 'en_US.UTF-8',
    ...additionalEnv,
  } as Record<string, string>;
}
