import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Monkey-patch ResizeObserver to schedule callbacks on rAF to avoid loop errors
if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
  const NativeResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class PatchedResizeObserver extends NativeResizeObserver {
    constructor(callback) {
      const wrapped = (entries, observer) => {
        // Schedule on next frame to let layout settle
        requestAnimationFrame(() => {
          try {
            callback(entries, observer);
          } catch (err) {
            // Swallow only the known benign loop errors
            const msg = err && err.message ? String(err.message) : '';
            if (
              msg.includes('ResizeObserver loop completed with undelivered notifications') ||
              msg.includes('ResizeObserver loop limit exceeded')
            ) {
              return;
            }
            throw err;
          }
        });
      };
      super(wrapped);
    }
  };
}

// Suppress benign ResizeObserver loop errors in dev (Vite overlay)
// See: https://github.com/WICG/resize-observer/issues/38
const suppressResizeObserverError = (event) => {
  const message = event?.message || '';
  if (typeof message === 'string' && (
    message.includes('ResizeObserver loop completed with undelivered notifications') ||
    message.includes('ResizeObserver loop limit exceeded')
  )) {
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    return true;
  }
  return false;
};

window.addEventListener('error', (event) => {
  if (suppressResizeObserverError(event)) return;
});

window.addEventListener('unhandledrejection', (event) => {
  const reasonMessage = event?.reason?.message || '';
  if (typeof reasonMessage === 'string' && (
    reasonMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
    reasonMessage.includes('ResizeObserver loop limit exceeded')
  )) {
    event.preventDefault?.();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
