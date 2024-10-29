import React, { useState, useEffect, FormEvent } from 'react';
import { messaging, db, auth } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  doc,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

interface ChatMessage {
  id?: string;
  text: string;
  uid: string;
  createdAt: any;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Sign in anonymously
    signInAnonymously(auth)
      .then(() => {
        console.log('Signed in anonymously');
        console.log('Current User UID:', auth.currentUser?.uid);
        setIsAuthenticated(true);
      })
      .catch((error) => {
        console.error('Anonymous sign-in failed:', error);
      });
  }, []);
  

  useEffect(() => {
    if (isAuthenticated) {
      // Request permission and get FCM token
      requestPermission();
    }
  }, [isAuthenticated]);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'BHgZSplK9WnPa2v6BON54swvWHqNDF1K23miMqNVcCgQhdQBM7pQBGgw68suGKp4Iru-VuaTm0e_SRVkfaTvK2M',
        });
        if (token) {
          console.log('FCM Token:', token);
          // Save the token to Firestore
          await setDoc(doc(db, 'fcmTokens', token), {
            uid: auth.currentUser?.uid,
          });
        } else {
          console.log('No registration token available.');
        }
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('An error occurred while retrieving token.', error);
    }
  };

  useEffect(() => {
    // Handle incoming messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      alert(`${payload.notification?.title}: ${payload.notification?.body}`);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Real-time listener for chat messages
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
    });

    return unsubscribe;
  }, []);

  // Add user identification in your message
  const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() !== '' && auth.currentUser) {
      try {
        await addDoc(collection(db, 'messages'), {
          text: input,
          createdAt: serverTimestamp(),
          uid: auth.currentUser.uid,
        });
        setInput('');
      } catch (error) {
        console.error('Error adding message:', error);
      }
    }
  };


  return (
    <div className="App">
      <h1>Simple Chat App</h1>
      <div className="chat-window">
        {messages.map((msg) => (
          <p key={msg.id}>
            <strong>{msg.uid === auth.currentUser?.uid ? 'You' : 'User'}:</strong> {msg.text}
          </p>
        ))}

      </div>
      <form onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default App;
