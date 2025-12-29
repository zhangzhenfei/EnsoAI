import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
import { AgentRegistry, BUILTIN_AGENTS } from '../services/agent/AgentRegistry';

const registry = new AgentRegistry(BUILTIN_AGENTS);

export function registerAgentHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.AGENT_LIST, async () => {
    return registry.list();
  });
}
