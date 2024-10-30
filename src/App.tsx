import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { messaging, db, auth } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';
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
import { onAuthStateChanged, signOut } from 'firebase/auth';

import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Box,
  Button,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Login from './Login';

interface ChatMessage {
  id?: string;
  text: string;
  uid: string;
  createdAt: any;
  displayName?: string; // Ensure this property is included
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Customize primary color
    },
    secondary: {
      main: '#dc004e', // Customize secondary color
    },
  },
});

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [user, setUser] = useState(auth.currentUser);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        console.log('User is signed in:', currentUser.uid);
        await requestPermission(currentUser);
      } else {
        console.log('No user is signed in.');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const requestPermission = async (currentUser: any) => {
    try {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        const token = await getToken(messaging, {
          vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
        });
        if (token) {
          console.log('FCM Token:', token);
          // Save the token to Firestore
          await setDoc(doc(db, 'fcmTokens', currentUser.uid), {
            token,
          });
          // Subscribe the token to a topic via your backend
          await fetch(`${BACKEND_URL}/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });
        } else {
          console.log('No registration token available.');
        }
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
    }
  };

  useEffect(() => {
    // Handle incoming messages when the app is in the foreground
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      // Customize how you handle the message in the foreground
      alert(`${payload.notification?.title}: ${payload.notification?.body}`);
    });

    return () => {
      unsubscribe();
    };
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
      scrollToBottom();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() !== '' && auth.currentUser) {
      try {
        await addDoc(collection(db, 'messages'), {
          text: input,
          createdAt: serverTimestamp(),
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || 'Anonymous',
        });
        setInput('');
        scrollToBottom();
      } catch (error) {
        console.error('Error adding message:', error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (!user) {
    // If the user is not authenticated, show the Login component
    return <Login />;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box display="flex" flexDirection="column" height="100%">
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" style={{ flexGrow: 1 }}>
              Chat App
            </Typography>
            {user && (
              <>
                <Typography variant="subtitle1" style={{ marginRight: '16px' }}>
                  {user.displayName || 'Anonymous'}
                </Typography>
                <Button color="inherit" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>

        <Container
          maxWidth="md"
          style={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          <Paper
            style={{
              flexGrow: 1,
              overflow: 'auto',
              padding: 16,
            }}
          >
            <List>
              {messages.map((msg) => (
                <ListItem
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems:
                      msg.uid === auth.currentUser?.uid
                        ? 'flex-end'
                        : 'flex-start',
                  }}
                >
                  <Box
                    bgcolor={
                      msg.uid === auth.currentUser?.uid ? '#dcf8c6' : '#f1f0f0'
                    }
                    borderRadius={3}
                    padding={1}
                    maxWidth="75%"
                  >
                    <ListItemText
                      primary={msg.text}
                      secondary={msg.displayName || 'Anonymous'}
                    />
                  </Box>
                </ListItem>
              ))}
              <div ref={messagesEndRef} />
            </List>
          </Paper>

          <form onSubmit={sendMessage} style={{ display: 'flex', marginTop: 8 }}>
            <TextField
              variant="outlined"
              fullWidth
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <IconButton type="submit" color="primary" aria-label="send">
              <SendIcon />
            </IconButton>
          </form>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
