import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import log from 'electron-log/renderer.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/ui/toast';
import './styles/globals.css';

// Initialize renderer logging with conservative defaults
// Starts with 'error' level to minimize IPC overhead until settings are loaded
log.transports.ipc.level = 'error';
Object.assign(console, log.functions);

/**
 * Update renderer logging configuration
 * Called by settings store after rehydration to sync with user preferences
 */
export function updateRendererLogging(
  enabled: boolean,
  level: 'error' | 'warn' | 'info' | 'debug'
) {
  // Control IPC transport level to reduce unnecessary IPC messages
  // When disabled, only send errors; when enabled, use configured level
  log.transports.ipc.level = enabled ? level : 'error';
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}
