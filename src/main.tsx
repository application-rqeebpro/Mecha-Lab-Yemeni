import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA mobile installability
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Mechatronics PWA Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.log('Service Worker registration skipped or failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
