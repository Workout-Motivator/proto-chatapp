import { createTheme, ThemeProvider } from '@mui/material/styles';
import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
} from 'firebase/auth';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
} from '@mui/material';

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

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Sign In and Sign Up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // For Sign Up
  const [error, setError] = useState<string | null>(null); // For error messages

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.log('Signed in with Google:', auth.currentUser?.uid);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setError('Google sign-in failed. Please try again.');
    }
  };

  const handleEmailSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Signed in with email:', auth.currentUser?.uid);
    } catch (error: any) {
      console.error('Email sign-in failed:', error);
      setError(error.message);
    }
  };

  const handleEmailSignUp = async () => {
    // Simple validation checks
    if (!email || !password || !displayName) {
      setError('Please fill in all fields.');
      return;
    }
  
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Update the user's display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName,
        });
        console.log('User display name set to:', displayName);
      }
      console.log('Signed up with email:', auth.currentUser?.uid);
    } catch (error: any) {
      console.error('Email sign-up failed:', error);
      setError(error.message);
    }
  };
  
  

  const handleAnonymousSignIn = async () => {
    try {
      await signInAnonymously(auth);
      console.log('Signed in anonymously:', auth.currentUser?.uid);
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
      setError('Anonymous sign-in failed. Please try again.');
    }
  };

  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setError(null);
  };

  return (
    <ThemeProvider theme={theme}>
        <Container maxWidth="sm">
        <Box mt={{ xs: 4, md: 8 }}>
            <Paper elevation={3} style={{ padding: 24 }}>
            <Typography variant="h5" gutterBottom align="center">
            {isSignUp ? 'Sign Up' : 'Sign In'}
            </Typography>
            {error && (
                <Alert severity="error" style={{ marginBottom: 16 }}>
                {error}
                </Alert>
            )}
            <Grid container spacing={2}>
                {isSignUp && (
                <Grid item xs={12}>
                    <TextField
                    label="Display Name"
                    variant="outlined"
                    fullWidth
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    />
                </Grid>
                )}
                <Grid item xs={12}>
                <TextField
                    label="Email"
                    variant="outlined"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                />
                </Grid>
                <Grid item xs={12}>
                <TextField
                    label="Password"
                    variant="outlined"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                />
                </Grid>
                <Grid item xs={12}>
                {isSignUp ? (
                    <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleEmailSignUp}
                    >
                    Sign Up with Email
                    </Button>
                ) : (
                    <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleEmailSignIn}
                    >
                    Sign In with Email
                    </Button>
                )}
                </Grid>

                {/* Toggle between Sign In and Sign Up */}
                <Grid item xs={12}>
                <Button variant="text" fullWidth onClick={toggleSignUp}>
                    {isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up"}
                </Button>
                </Grid>

                {/* Google Sign-In */}
                {!isSignUp && (
                <Grid item xs={12}>
                    <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    onClick={handleGoogleSignIn}
                    >
                    Sign In with Google
                    </Button>
                </Grid>
                )}

                {/* Anonymous Sign-In */}
                {!isSignUp && (
                <Grid item xs={12}>
                    <Button
                    variant="text"
                    color="secondary"
                    fullWidth
                    onClick={handleAnonymousSignIn}
                    >
                    Continue Anonymously
                    </Button>
                </Grid>
                )}
            </Grid>
            </Paper>
        </Box>
        </Container>
    </ThemeProvider>
  );
};

export default Login;
