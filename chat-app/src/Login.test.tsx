import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { auth, googleProvider } from './firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signInAnonymously,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

// Mock Firebase auth functions
jest.mock('./firebase', () => ({
  auth: {},
  googleProvider: {},
}));

jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInAnonymously: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders sign-in form', () => {
    render(<Login />);
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In with Email/i })).toBeInTheDocument();
  });

  test('toggles to sign-up form', () => {
    render(<Login />);
    fireEvent.click(screen.getByText(/Don't have an account\? Sign Up/i));
    expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up with Email/i })).toBeInTheDocument();
  });

  test('handles email sign-in', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({});

    render(<Login />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In with Email/i }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
    });
  });

  test('handles email sign-up', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({});
    render(<Login />);
    fireEvent.click(screen.getByText(/Don't have an account\? Sign Up/i));

    fireEvent.change(screen.getByLabelText(/Display Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'newuser@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'newpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign Up with Email/i }));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'newuser@example.com', 'newpassword');
    });
  });

  test('handles Google sign-in', async () => {
    (signInWithPopup as jest.Mock).mockResolvedValue({});
    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /Sign In with Google/i }));

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalledWith(auth, googleProvider);
    });
  });

  test('handles anonymous sign-in', async () => {
    (signInAnonymously as jest.Mock).mockResolvedValue({});
    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /Continue Anonymously/i }));

    await waitFor(() => {
      expect(signInAnonymously).toHaveBeenCalledWith(auth);
    });
  });

  test('displays error message on sign-in failure', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
    render(<Login />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In with Email/i }));

    const errorMessage = await screen.findByText(/Invalid credentials/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
