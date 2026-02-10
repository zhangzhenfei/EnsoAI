import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import log from 'electron-log/renderer.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/ui/toast';
import './styles/globals.css';

// Hijack console methods to use electron-log in renderer process
// NOTE: This hijacking is unconditional and happens at module load time.
// Renderer logs are forwarded to main process via IPC, where the main process's
// transport level settings (file/console) control whether logs are actually written.
// When logging is disabled in settings, main process sets file level to 'error',
// effectively filtering out info/warn/debug logs from renderer.
Object.assign(console, log.functions);

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
