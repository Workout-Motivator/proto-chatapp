// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, browserLocalPersistence, setPersistence } from 'firebase/auth';


// Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBYbg0uesOqy7Rd1kYE3x6v8KYHi9XF0TU",
    authDomain: "chat-app-1fec7.firebaseapp.com",
    projectId: "chat-app-1fec7",
    storageBucket: "chat-app-1fec7.appspot.com",
    messagingSenderId: "597651943419",
    appId: "1:597651943419:web:1717616f89a1765759655e",
    measurementId: "G-XX0P95KB75"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
const messaging = getMessaging(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Set authentication persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Now sign in anonymously
    return signInAnonymously(auth);
  })
  .then(() => {
    console.log('Signed in anonymously');
  })
  .catch((error) => {
    console.error('Anonymous sign-in failed:', error);
  });

export { messaging, db, auth };