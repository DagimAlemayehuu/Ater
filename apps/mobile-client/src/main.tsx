import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Initialize LifeOS Scriptable Bridge
if (typeof window !== 'undefined') {
  (window as any).LifeOS = (window as any).LifeOS || {
    send: (type: string, message: any) => {
      // @ts-ignore
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.scriptable) {
        // @ts-ignore
        window.webkit.messageHandlers.scriptable.postMessage(JSON.stringify({ type, ...message }));
      }
    },
    onResponse: (requestId: string, data: any, error: any) => {
      const event = new CustomEvent('lifeos-api-response', {
        detail: { requestId, data, error }
      });
      window.dispatchEvent(event);
    }
  };
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);

// Force hide bootloader once React starts execution
setTimeout(() => {
  const loader = document.getElementById('boot-loader');
  if (loader) loader.style.display = 'none';
}, 100);
