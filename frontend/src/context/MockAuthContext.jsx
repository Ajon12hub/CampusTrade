import React, { createContext, useContext, useState, useEffect } from 'react';

const MockAuthContext = createContext(null);

export const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if there is an active mock session
    const mockUserStr = localStorage.getItem('campustrade_mock_user');
    if (mockUserStr) {
      try {
        const mockUser = JSON.parse(mockUserStr);
        setUser(mockUser);
        setIsSignedIn(true);
      } catch (e) {
        console.error('Error parsing mock user session', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const login = (email, name = '') => {
    const username = email.split('@')[0];
    const cleanName = name || username.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    // Simulate different profiles (e.g. testing Admin user if email starts with admin)
    const isAdmin = email.toLowerCase().startsWith('admin');
    
    const mockUser = {
      clerkId: `usr_${username}`,
      email: email.toLowerCase(),
      name: cleanName,
      department: 'Computer Science',
      year: '3rd Year',
      contactDetails: 'Hostel Block C, Room 304',
      isAdmin,
    };

    localStorage.setItem('campustrade_mock_user', JSON.stringify(mockUser));
    setUser(mockUser);
    setIsSignedIn(true);
    return mockUser;
  };

  const register = (name, email, department, year, contactDetails) => {
    const username = email.split('@')[0];
    const mockUser = {
      clerkId: `usr_${username}`,
      email: email.toLowerCase(),
      name,
      department: department || 'Engineering',
      year: year || '1st Year',
      contactDetails: contactDetails || 'Not specified',
      isAdmin: email.toLowerCase().startsWith('admin'),
    };

    localStorage.setItem('campustrade_mock_user', JSON.stringify(mockUser));
    setUser(mockUser);
    setIsSignedIn(true);
    return mockUser;
  };

  const logout = () => {
    localStorage.removeItem('campustrade_mock_user');
    setUser(null);
    setIsSignedIn(false);
  };

  const updateMockProfile = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    localStorage.setItem('campustrade_mock_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <MockAuthContext.Provider
      value={{
        user,
        isSignedIn,
        isLoaded,
        login,
        register,
        logout,
        updateMockProfile,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};
