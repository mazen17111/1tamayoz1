import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Handle Telegram WebApp environment if detected
if (typeof window !== 'undefined') {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready?.();
      tg.expand?.();
      tg.enableClosingConfirmation?.();
    }
  } catch (err) {
    console.warn('[Telegram WebApp Init]', err);
  }
}

// Global safety catch for in-app webviews to prevent crashes or closures
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // Avoid noisy webview crash triggers on non-critical script or layout warnings
    if (event.message && (
      event.message.includes('ResizeObserver') ||
      event.message.includes('Script error') ||
      event.message.includes('play()')
    )) {
      event.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    // Suppress video autoplay or transient fetch abort rejections in webviews
    if (event.reason && (
      event.reason.name === 'AbortError' ||
      event.reason.name === 'NotAllowedError' ||
      String(event.reason).includes('play()')
    )) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

