import { User } from '../types';

const USER_KEY = 'lenscraft_user';

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const login = async (email: string, password: string): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (!email.includes('@')) {
    throw new Error("Invalid email address");
  }

  // Mock successful login
  const user: User = {
    id: 'user_' + Date.now(),
    name: email.split('@')[0], // Use part of email as name if not provided
    email: email,
    avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=2563EB&color=fff`
  };

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

export const signup = async (name: string, email: string, password: string): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (!email.includes('@')) throw new Error("Invalid email address");
  if (password.length < 6) throw new Error("Password must be at least 6 characters");

  const user: User = {
    id: 'user_' + Date.now(),
    name: name,
    email: email,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563EB&color=fff`
  };

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

export const loginWithGoogle = async (): Promise<User> => {
  // Simulate popup and network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const user: User = {
    id: 'google_' + Date.now(),
    name: 'Google User',
    email: 'user@gmail.com',
    avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
  };

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

export const logout = (): void => {
  localStorage.removeItem(USER_KEY);
};