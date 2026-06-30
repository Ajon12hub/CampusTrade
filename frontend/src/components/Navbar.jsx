import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppAuth } from '../hooks/useAppAuth';
import { UserButton } from '@clerk/clerk-react';
import { GraduationCap, LogOut, LayoutDashboard, PlusCircle, User, ShieldAlert, Menu, X, ShoppingBag } from 'lucide-react';

export default function Navbar() {
  const { isSignedIn, isClerkEnabled, user, logout } = useAppAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Marketplace', path: '/' },
    { name: 'Dashboard', path: '/dashboard', authRequired: true },
    { name: 'Profile', path: '/profile', authRequired: true },
  ];

  return (
    <nav className="glass-nav sticky top-0 z-50 px-4 md:px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-brand-600/10 border border-brand-500/30 group-hover:bg-brand-500/20 transition-all">
            <GraduationCap className="h-6 w-6 text-brand-400" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-dark-100 to-brand-400 bg-clip-text text-transparent">
            CampusTrade
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            if (link.authRequired && !isSignedIn) return null;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-brand-400 font-semibold'
                    : 'text-dark-300 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {/* Admin Panel Link */}
          {isSignedIn && user?.isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors py-1 px-3 rounded-full bg-indigo-500/10 border border-indigo-500/20`}
            >
              <ShieldAlert className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {isSignedIn ? (
            <>
              <Link
                to="/add-product"
                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-brand-600/10 hover:shadow-brand-500/25"
              >
                <PlusCircle className="h-4 w-4" />
                List Item
              </Link>
              
              {isClerkEnabled ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <div className="flex items-center gap-3 bg-dark-900 border border-dark-850 p-1.5 pr-3.5 rounded-full">
                  <img
                    src={user?.imageUrl}
                    alt={user?.name}
                    className="w-7 h-7 rounded-full border border-brand-500/40"
                  />
                  <span className="text-xs font-semibold text-dark-100 max-w-[100px] truncate">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="p-1 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Log Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm font-semibold text-white bg-dark-800 hover:bg-dark-700 border border-dark-700/50 py-2.5 px-5 rounded-xl transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-dark-300 hover:text-white hover:bg-dark-900 border border-dark-850 transition-colors"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-dark-800/80 animate-fade-in space-y-3">
          {navLinks.map((link) => {
            if (link.authRequired && !isSignedIn) return null;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-brand-500/10 text-brand-400 border-l-4 border-brand-500 font-semibold'
                    : 'text-dark-300 hover:bg-dark-900 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {isSignedIn && user?.isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-indigo-400 hover:bg-dark-900 transition-colors"
            >
              <ShieldAlert className="h-4 w-4" />
              Admin Panel
            </Link>
          )}

          <div className="pt-2 border-t border-dark-850 space-y-2">
            {isSignedIn ? (
              <>
                <Link
                  to="/add-product"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  List Item
                </Link>
                
                {!isClerkEnabled && (
                  <div className="flex items-center justify-between p-3 bg-dark-900 border border-dark-850 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user?.imageUrl}
                        alt={user?.name}
                        className="w-8 h-8 rounded-full border border-brand-500/40"
                      />
                      <div>
                        <p className="text-xs font-semibold text-white">{user?.name}</p>
                        <p className="text-[10px] text-dark-400 truncate max-w-[150px]">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="p-2 rounded-lg text-dark-450 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full text-sm font-semibold text-white bg-dark-800 hover:bg-dark-700 py-2.5 rounded-xl transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
