import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import ErrorBoundary from './components/system/ErrorBoundary.tsx';
import './styles/theme.css';
import './index.css';

// Global error listeners
window.addEventListener('error', (e: ErrorEvent) => {
  if (String(e?.message || '').includes('Loading chunk')) {
    console.error('[ChunkLoadError] A new version may have been deployed. Please refresh the page.');
    // You could show a UI element here to prompt the user to refresh.
  } else {
    console.error('[window.error]', e.error ?? e.message);
  }
});
window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  console.error('[unhandledrejection]', e.reason);
});

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
