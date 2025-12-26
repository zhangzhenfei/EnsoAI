import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import type { ShellConfig, ShellInfo } from '@shared/types';

const execAsync = promisify(exec);
const isWindows = process.platform === 'win32';

interface ShellDefinition {
  id: string;
  name: string;
  paths: string[];
  args: string[];
  isWsl?: boolean;
}

const WINDOWS_SHELLS: ShellDefinition[] = [
  {
    id: 'powershell7',
    name: 'PowerShell 7',
    paths: ['C:\\Program Files\\PowerShell\\7\\pwsh.exe'],
    args: ['-NoLogo'],
  },
  {
    id: 'powershell',
    name: 'PowerShell',
    paths: ['powershell.exe'],
    args: ['-NoLogo'],
  },
  {
    id: 'cmd',
    name: 'Command Prompt',
    paths: ['cmd.exe'],
    args: [],
  },
  {
    id: 'gitbash',
    name: 'Git Bash',
    paths: ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files (x86)\\Git\\bin\\bash.exe'],
    args: ['-i', '-l'],
  },
  {
    id: 'nushell',
    name: 'Nushell',
    paths: [
      'C:\\Program Files\\nu\\bin\\nu.exe',
      `${process.env.USERPROFILE}\\.cargo\\bin\\nu.exe`,
      `${process.env.USERPROFILE}\\scoop\\shims\\nu.exe`,
    ],
    args: ['-l', '-i'],
  },
  {
    id: 'wsl',
    name: 'WSL',
    paths: ['wsl.exe'],
    args: [],
    isWsl: true,
  },
];

const UNIX_SHELLS: ShellDefinition[] = [
  {
    id: 'zsh',
    name: 'Zsh',
    paths: ['/bin/zsh', '/usr/bin/zsh', '/usr/local/bin/zsh', '/opt/homebrew/bin/zsh'],
    args: ['-i', '-l'],
  },
  {
    id: 'bash',
    name: 'Bash',
    paths: ['/bin/bash', '/usr/bin/bash', '/usr/local/bin/bash'],
    args: ['-i', '-l'],
  },
  {
    id: 'fish',
    name: 'Fish',
    paths: ['/usr/bin/fish', '/usr/local/bin/fish', '/opt/homebrew/bin/fish'],
    args: ['-i', '-l'],
  },
  {
    id: 'nushell',
    name: 'Nushell',
    paths: ['/usr/local/bin/nu', '/opt/homebrew/bin/nu', `${process.env.HOME}/.cargo/bin/nu`],
    args: ['-l', '-i'],
  },
  {
    id: 'sh',
    name: 'Sh',
    paths: ['/bin/sh'],
    args: [],
  },
];

class ShellDetector {
  private cachedShells: ShellInfo[] | null = null;
  private wslAvailable: boolean | null = null;

  private async isWslAvailable(): Promise<boolean> {
    if (this.wslAvailable !== null) {
      return this.wslAvailable;
    }
    if (!isWindows) {
      this.wslAvailable = false;
      return false;
    }
    try {
      await execAsync('wsl --status', { timeout: 3000 });
      this.wslAvailable = true;
      return true;
    } catch {
      this.wslAvailable = false;
      return false;
    }
  }

  private findAvailablePath(paths: string[]): string | null {
    for (const p of paths) {
      if (p.includes('\\') || p.startsWith('/')) {
        if (existsSync(p)) {
          return p;
        }
      } else {
        return p;
      }
    }
    return null;
  }

  private async detectWindowsShells(): Promise<ShellInfo[]> {
    const shells: ShellInfo[] = [];

    for (const def of WINDOWS_SHELLS) {
      if (def.isWsl) {
        if (await this.isWslAvailable()) {
          shells.push({
            id: def.id,
            name: def.name,
            path: 'wsl.exe',
            args: def.args,
            available: true,
            isWsl: true,
          });
        }
        continue;
      }

      const path = this.findAvailablePath(def.paths);
      shells.push({
        id: def.id,
        name: def.name,
        path: path || def.paths[0],
        args: def.args,
        available: path !== null,
      });
    }

    return shells;
  }

  private detectUnixShells(): ShellInfo[] {
    const shells: ShellInfo[] = [];
    const systemShell = process.env.SHELL;

    if (systemShell) {
      const systemShellName = systemShell.split('/').pop() || 'shell';
      shells.push({
        id: 'system',
        name: `System Default (${systemShellName})`,
        path: systemShell,
        args: ['-i', '-l'],
        available: existsSync(systemShell),
      });
    }

    for (const def of UNIX_SHELLS) {
      const path = this.findAvailablePath(def.paths);
      shells.push({
        id: def.id,
        name: def.name,
        path: path || def.paths[0],
        args: def.args,
        available: path !== null,
      });
    }

    return shells;
  }

  async detectShells(): Promise<ShellInfo[]> {
    if (this.cachedShells) {
      return this.cachedShells;
    }

    const shells = isWindows ? await this.detectWindowsShells() : this.detectUnixShells();

    this.cachedShells = shells;
    return shells;
  }

  resolveShellConfig(config: ShellConfig): { shell: string; args: string[] } {
    if (config.shellType === 'custom') {
      return {
        shell: config.customShellPath || (isWindows ? 'powershell.exe' : '/bin/sh'),
        args: config.customShellArgs || [],
      };
    }

    const definitions = isWindows ? WINDOWS_SHELLS : UNIX_SHELLS;

    if (config.shellType === 'system' && !isWindows) {
      const systemShell = process.env.SHELL;
      if (systemShell && existsSync(systemShell)) {
        return { shell: systemShell, args: ['-i', '-l'] };
      }
    }

    const def = definitions.find((d) => d.id === config.shellType);
    if (def) {
      const path = this.findAvailablePath(def.paths);
      if (path) {
        return { shell: path, args: def.args };
      }
    }

    return isWindows
      ? { shell: 'powershell.exe', args: ['-NoLogo'] }
      : { shell: '/bin/sh', args: [] };
  }

  getDefaultShell(): string {
    if (isWindows) {
      const pwsh = 'C:\\Program Files\\PowerShell\\7\\pwsh.exe';
      if (existsSync(pwsh)) {
        return pwsh;
      }
      return 'powershell.exe';
    }

    const shell = process.env.SHELL;
    if (shell) {
      // Ignore invalid absolute $SHELL values (common when launched from GUI or misconfigured)
      if (!shell.startsWith('/') || existsSync(shell)) {
        return shell;
      }
    }

    const shells = ['/bin/zsh', '/bin/bash', '/bin/sh'];
    for (const s of shells) {
      if (existsSync(s)) {
        return s;
      }
    }

    return '/bin/sh';
  }

  clearCache(): void {
    this.cachedShells = null;
    this.wslAvailable = null;
  }
}

export const shellDetector = new ShellDetector();

export function detectShell(): string {
  return shellDetector.getDefaultShell();
}
