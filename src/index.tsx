import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Remove imports for serviceWorkerRegistration and reportWebVitals
// import * as serviceWorkerRegistration from './serviceWorkerRegistration';
// import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove the default CRA service worker registration to avoid conflicts
// serviceWorkerRegistration.register();

// Register the Firebase Messaging service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/firebase-messaging-sw.js`)
      .then((registration) => {
        console.log('Service Worker registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.error('Service Worker registration failed: ', err);
      });
  });
}

// Remove or comment out reportWebVitals if not used
// reportWebVitals();