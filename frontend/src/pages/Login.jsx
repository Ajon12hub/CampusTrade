import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useAppAuth } from '../hooks/useAppAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, ArrowRight, User, Shield, Info } from 'lucide-react';

export default function Login() {
  const { isClerkEnabled, login, register } = useAppAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  // State for mock mode
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Form handlers for mock mode
  const handleMockLogin = (e) => {
    e.preventDefault();
    if (!email) return setError('Email is required');
    if (!email.includes('@')) return setError('Please enter a valid college email');
    
    login(email);
    navigate(redirect);
  };

  const handleMockRegister = (e) => {
    e.preventDefault();
    if (!email || !name) return setError('All fields are required');
    if (!email.includes('@')) return setError('Please enter a valid college email');

    register(name, email, 'Computer Science', '3rd Year', 'Hostel Block A');
    navigate(redirect);
  };

  // Pre-configured developer login actions
  const triggerQuickLogin = (role) => {
    if (role === 'student') {
      login('alex.jones@college.edu', 'Alex Jones');
    } else if (role === 'admin') {
      login('admin.moderator@college.edu', 'Admin Moderator');
    }
    navigate(redirect);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4 py-12 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '3s' }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-500/10 border border-brand-500/25 mb-4 animate-float">
            <GraduationCap className="h-10 w-10 text-brand-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">CampusTrade</h1>
          <p className="mt-2 text-sm text-dark-350">The Student Exchange Marketplace</p>
        </div>

        <div className="glass-panel rounded-3xl p-8 shadow-premium glow-card">
          {isClerkEnabled ? (
            // ================== CLERK MODE ==================
            <div className="flex flex-col items-center">
              {searchParams.get('mode') === 'signup' ? (
                <SignUp signInUrl="/login" forceRedirectUrl={redirect} />
              ) : (
                <SignIn signUpUrl="/login?mode=signup" forceRedirectUrl={redirect} />
              )}
            </div>
          ) : (
            // ================== MOCK AUTH MODE ==================
            <div>
              <div className="flex border-b border-dark-700/50 mb-6 pb-2">
                <button
                  type="button"
                  className={`flex-1 text-center py-2 text-sm font-semibold transition-all ${
                    !isRegisterMode ? 'text-brand-400 border-b-2 border-brand-500' : 'text-dark-400 hover:text-dark-100'
                  }`}
                  onClick={() => {
                    setIsRegisterMode(false);
                    setError('');
                  }}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className={`flex-1 text-center py-2 text-sm font-semibold transition-all ${
                    isRegisterMode ? 'text-brand-400 border-b-2 border-brand-500' : 'text-dark-400 hover:text-dark-100'
                  }`}
                  onClick={() => {
                    setIsRegisterMode(true);
                    setError('');
                  }}
                >
                  Sign Up
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  {error}
                </div>
              )}

              {!isRegisterMode ? (
                <form onSubmit={handleMockLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">College Email</label>
                    <input
                      type="email"
                      placeholder="you@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-dark-900/50 border border-dark-700/50 focus:border-brand-500 focus:outline-none rounded-xl py-3 px-4 text-white text-sm transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-brand-600/10 hover:shadow-brand-500/20 flex items-center justify-center gap-2 group"
                  >
                    Enter Marketplace
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleMockRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="Alex Jones"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-dark-900/50 border border-dark-700/50 focus:border-brand-500 focus:outline-none rounded-xl py-3 px-4 text-white text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">College Email</label>
                    <input
                      type="email"
                      placeholder="you@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-dark-900/50 border border-dark-700/50 focus:border-brand-500 focus:outline-none rounded-xl py-3 px-4 text-white text-sm transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-brand-600/10 hover:shadow-brand-500/20 flex items-center justify-center gap-2 group"
                  >
                    Create Account
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}

              {/* Developer shortcuts */}
              <div className="mt-8 pt-6 border-t border-dark-800">
                <div className="flex items-center gap-2 mb-4 text-dark-400 text-xs">
                  <Info className="h-4 w-4 text-brand-400" />
                  <span>Developer 1-Click Login Testing:</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => triggerQuickLogin('student')}
                    className="flex items-center justify-center gap-2 bg-dark-900 hover:bg-dark-850 border border-dark-700/30 text-xs text-dark-200 py-2.5 px-3 rounded-xl transition-colors font-medium"
                  >
                    <User className="h-3.5 w-3.5 text-brand-400" />
                    Student Profile
                  </button>
                  <button
                    onClick={() => triggerQuickLogin('admin')}
                    className="flex items-center justify-center gap-2 bg-dark-900 hover:bg-dark-850 border border-dark-700/30 text-xs text-dark-200 py-2.5 px-3 rounded-xl transition-colors font-medium"
                  >
                    <Shield className="h-3.5 w-3.5 text-indigo-400" />
                    Admin Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
