/* eslint-env worker */
/* global firebase */

// Import scripts for Firebase messaging
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyBYbg0uesOqy7Rd1kYE3x6v8KYHi9XF0TU",
    authDomain: "chat-app-1fec7.firebaseapp.com",
    projectId: "chat-app-1fec7",
    storageBucket: "chat-app-1fec7.appspot.com",
    messagingSenderId: "597651943419",
    appId: "1:597651943419:web:1717616f89a1765759655e",
    measurementId: "G-XX0P95KB75"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
  };

  this.registration.showNotification(notificationTitle, notificationOptions);
});
