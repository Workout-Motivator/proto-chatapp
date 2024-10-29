import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
import { getToken } from 'firebase/messaging';

// Mock Firebase modules
jest.mock('./firebase', () => ({
  auth: {},
  db: {},
  messaging: {},
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  doc: jest.fn(),
}));

jest.mock('firebase/messaging', () => ({
  getToken: jest.fn(),
  onMessage: jest.fn(),
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('requests notification permission on authentication', async () => {
    // Mock authentication state
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback({ uid: 'user123', displayName: 'Test User' });
      return jest.fn();
    });
  
    // Mock Notification permission
    const originalNotification = global.Notification;
    global.Notification = {
      requestPermission: jest.fn().mockResolvedValue('granted'),
    } as any;
  
    // Mock getToken
    (getToken as jest.Mock).mockResolvedValue('mock-token');
  
    render(<App />);
  
    await waitFor(() => {
      expect(Notification.requestPermission).toHaveBeenCalled();
    });
  
    // Clean up
    global.Notification = originalNotification;
  });
  

  test('renders Login component when not authenticated', () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn();
    });

    render(<App />);
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
  });

  test('renders chat interface when authenticated', async () => {
    // Mock authentication state
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback({ uid: 'user123', displayName: 'Test User' });
      return jest.fn();
    });

    // Mock Firestore messages
    (onSnapshot as jest.Mock).mockImplementation((query, callback) => {
      callback({
        forEach: (fn: Function) => {
          fn({
            id: 'msg1',
            data: () => ({
              text: 'Hello World',
              uid: 'user123',
              displayName: 'Test User',
              createdAt: { seconds: 1630000000 },
            }),
          });
        },
      });
      return jest.fn();
    });

    render(<App />);

    expect(await screen.findByText(/Chat App/i)).toBeInTheDocument();
    expect(screen.getByText(/Hello World/i)).toBeInTheDocument();
  });

  test('sends a new message', async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback({ uid: 'user123', displayName: 'Test User' });
      return jest.fn();
    });

    (addDoc as jest.Mock).mockResolvedValue({});

    render(<App />);

    // Simulate typing a message
    fireEvent.change(screen.getByPlaceholderText(/Type your message.../i), {
      target: { value: 'Test message' },
    });

    // Simulate sending the message
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(expect.anything(), {
        text: 'Test message',
        createdAt: serverTimestamp(),
        uid: 'user123',
        displayName: 'Test User',
      });
    });
  });

  test('signs out the user', async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback({ uid: 'user123', displayName: 'Test User' });
      return jest.fn();
    });

    render(<App />);

    fireEvent.click(screen.getByText(/Sign Out/i));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith(auth);
    });
  });
});
