import { useEffect, useState, createContext, useContext } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useMockAuth } from '../context/MockAuthContext';
import { userAPI, setClerkTokenFetcher } from '../services/api';

const AppAuthContext = createContext(null);

export const AppAuthProvider = ({ children }) => {
  const isClerkEnabled = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  // Real Clerk Hooks
  const clerkAuth = isClerkEnabled ? useAuth() : null;
  const clerkUser = isClerkEnabled ? useUser() : null;

  // Mock Hooks
  const mockAuth = useMockAuth();

  // Unified State
  const [dbUser, setDbUser] = useState(null);
  const [isLoadingDbUser, setIsLoadingDbUser] = useState(false);
  const [hasAttemptedSync, setHasAttemptedSync] = useState(false);

  // Link Clerk token to API service
  useEffect(() => {
    if (isClerkEnabled && clerkAuth) {
      setClerkTokenFetcher(() => clerkAuth.getToken());
    }
  }, [isClerkEnabled, clerkAuth]);

  // Determine auth status
  const isSignedIn = isClerkEnabled 
    ? !!(clerkAuth && clerkAuth.isSignedIn)
    : mockAuth.isSignedIn;

  const isLoaded = isClerkEnabled
    ? !!(clerkAuth && clerkAuth.isLoaded && clerkUser && clerkUser.isLoaded)
    : mockAuth.isLoaded;

  const activeClerkUser = clerkUser?.user;
  const activeMockUser = mockAuth.user;

  // Fetch or sync DB User Profile once signed in
  const fetchDbProfile = async () => {
    if (!isSignedIn) {
      setDbUser(null);
      setHasAttemptedSync(false);
      return;
    }
    
    setIsLoadingDbUser(true);
    try {
      const response = await userAPI.getProfile();
      setDbUser(response.data);
    } catch (error) {
      console.error('Failed to load database user profile:', error);
    } finally {
      setIsLoadingDbUser(false);
      setHasAttemptedSync(true);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchDbProfile();
    } else {
      setDbUser(null);
      setHasAttemptedSync(false);
    }
  }, [isLoaded, isSignedIn, activeClerkUser?.id, activeMockUser?.clerkId]);

  const logout = () => {
    setDbUser(null);
    setHasAttemptedSync(false);
    if (isClerkEnabled) {
      clerkAuth.signOut();
    } else {
      mockAuth.logout();
    }
  };

  const refreshDbUser = async () => {
    await fetchDbProfile();
  };

  // Get user details
  const getAppUser = () => {
    if (!isSignedIn) return null;
    
    if (isClerkEnabled && activeClerkUser) {
      return {
        clerkId: activeClerkUser.id,
        email: activeClerkUser.primaryEmailAddress?.emailAddress || '',
        name: activeClerkUser.fullName || activeClerkUser.firstName || 'Student',
        imageUrl: activeClerkUser.imageUrl,
        ...dbUser, // Merge DB profile data
      };
    } else if (activeMockUser) {
      return {
        ...activeMockUser,
        imageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeMockUser.name)}`,
        ...dbUser, // Merge DB profile data
      };
    }
    return null;
  };

  const user = getAppUser();

  return (
    <AppAuthContext.Provider
      value={{
        isClerkEnabled,
        isSignedIn,
        isLoaded: isLoaded && (!isSignedIn || dbUser !== null || hasAttemptedSync),
        user,
        dbUser,
        logout,
        refreshDbUser,
        // Mock specific functions (ignored in Clerk mode)
        login: mockAuth.login,
        register: mockAuth.register,
      }}
    >
      {children}
    </AppAuthContext.Provider>
  );
};

export const useAppAuth = () => {
  const context = useContext(AppAuthContext);
  if (!context) {
    throw new Error('useAppAuth must be used within an AppAuthProvider');
  }
  return context;
};
