import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { MockAuthProvider } from './context/MockAuthContext';
import { AppAuthProvider, useAppAuth } from './hooks/useAppAuth';

// Components & Pages
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import ProductDetails from './pages/ProductDetails';
import AddEditProduct from './pages/AddEditProduct';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

// Fetch Clerk key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Conditional wrapper to prevent Clerk SDK from crashing if keys are missing
function ClerkAuthWrapper({ children }) {
  if (clerkPubKey && clerkPubKey.trim() !== '') {
    return (
      <ClerkProvider publishableKey={clerkPubKey}>
        {children}
      </ClerkProvider>
    );
  }
  return <>{children}</>;
}

// Protected Route Guard for authentication-gated pages
function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAppAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Layout wrapper mapping headers and views
function AppLayout() {
  return (
    <div className="min-h-screen bg-dark-950 text-dark-100 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Views */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/products/:id" element={<ProductDetails />} />

          {/* Protected Views */}
          <Route
            path="/add-product"
            element={
              <ProtectedRoute>
                <AddEditProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-product/:id"
            element={
              <ProtectedRoute>
                <AddEditProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="py-6 border-t border-dark-850 bg-dark-950 text-center text-xs text-dark-500">
        &copy; {new Date().getFullYear()} CampusTrade. Created for college communities.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ClerkAuthWrapper>
      <MockAuthProvider>
        <AppAuthProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </AppAuthProvider>
      </MockAuthProvider>
    </ClerkAuthWrapper>
  );
}
