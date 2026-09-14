import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config.js';
import { login, signup, logout, getUserProfile } from '../firebase/auth.js';
import { UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  userName: string;
  loading: boolean;
  loginUser: (email: string, password: string) => Promise<string | null>;
  signupUser: (email: string, password: string, role: 'business' | 'officer', name: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setRole(profile.role as UserRole);
            setUserName(profile.name || '');
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
        }
      } else {
        setUser(null);
        setRole(null);
        setUserName('');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginUser = async (email: string, password: string): Promise<string | null> => {
    const credential = await login(email, password);
    const profile = await getUserProfile(credential.user.uid);
    if (profile) {
      setRole(profile.role as UserRole);
      setUserName(profile.name || '');
      return profile.role;
    }
    return null;
  };

  const signupUser = async (
    email: string,
    password: string,
    selectedRole: 'business' | 'officer',
    name: string
  ) => {
    await signup(email, password, selectedRole, name);
    setRole(selectedRole);
    setUserName(name);
  };

  const logoutUser = async () => {
    await logout();
    setUser(null);
    setRole(null);
    setUserName('');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        userName,
        loading,
        loginUser,
        signupUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
