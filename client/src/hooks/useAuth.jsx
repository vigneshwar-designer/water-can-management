import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, settingsService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    businessName: 'Water Can Co.',
    logo: '',
    waterPrice: 30,
    depositAmount: 200,
  });
  const [loading, setLoading] = useState(true);

  // Load auth state and settings on mount
  useEffect(() => {
    async function initAuth() {
      const currentUser = authService.getCurrentUser();
      const token = authService.getToken();
      
      if (currentUser && token) {
        setUser(currentUser);
      }
      
      // Fetch settings (even if guest, but API is authenticated, so if logged in, fetch it)
      if (token) {
        try {
          const systemSettings = await settingsService.get();
          setSettings(systemSettings);
        } catch (err) {
          console.error("Failed to load settings:", err);
        }
      }
      
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      setUser(data.user);
      
      // Load settings immediately on login
      const systemSettings = await settingsService.get();
      setSettings(systemSettings);
      
      return data.user;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshSettings = async () => {
    try {
      const systemSettings = await settingsService.get();
      setSettings(systemSettings);
    } catch (err) {
      console.error("Error refreshing settings:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, settings, loading, login, logout, refreshSettings }}>
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
