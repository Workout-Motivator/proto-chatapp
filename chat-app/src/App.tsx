import React, { useState, useEffect, FormEvent, useRef } from 'react';
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
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { createTheme, ThemeProvider } from '@mui/material/styles';

interface ChatMessage {
  id?: string;
  text: string;
  uid: string;
  createdAt: any;
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Sign in anonymously if not already signed in
    if (!auth.currentUser) {
      signInAnonymously(auth)
        .then(() => {
          console.log('Signed in anonymously');
          console.log('Current User UID:', auth.currentUser?.uid);
          // After signing in, request notification permission
          requestPermission();
        })
        .catch((error) => {
          console.error('Anonymous sign-in failed:', error);
        });
    } else {
      // If already signed in, request notification permission
      requestPermission();
    }
  }, []);

  const requestPermission = async () => {
    try {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        // Get the FCM token
        const token = await getToken(messaging, {
          vapidKey: 'BHgZSplK9WnPa2v6BON54swvWHqNDF1K23miMqNVcCgQhdQBM7pQBGgw68suGKp4Iru-VuaTm0e_SRVkfaTvK2M', // Replace with your actual public VAPID key
        });
        if (token) {
          console.log('FCM Token:', token);
          // Save the token to Firestore
          await setDoc(doc(db, 'fcmTokens', token), {
            uid: auth.currentUser?.uid,
            token,
          });
        } else {
          console.log('No registration token available.');
        }
      } else {
        console.log('Unable to get permission to notify.');
      }
    } catch (error) {
      console.error('An error occurred while retrieving token.', error);
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
        });
        setInput('');
        scrollToBottom();
      } catch (error) {
        console.error('Error adding message:', error);
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box display="flex" flexDirection="column" height="100%">
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6">Chat App</Typography>
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
                    justifyContent:
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
                      secondary={
                        msg.uid === auth.currentUser?.uid ? 'You' : 'User'
                      }
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
