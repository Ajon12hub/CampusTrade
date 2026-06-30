import React, { useState, useEffect } from 'react';
import { useAppAuth } from '../hooks/useAppAuth';
import { userAPI } from '../services/api';
import { User, BookOpen, GraduationCap, MapPin, Save, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Business Administration',
  'Literature',
  'Other',
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate / PG', 'PhD Scholar'];

export default function Profile() {
  const { isSignedIn, user, refreshDbUser, isClerkEnabled, login } = useAppAuth();

  // Form states
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('1st Year');
  const [contactDetails, setContactDetails] = useState('');
  
  // App states
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Sync state once profile loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setDepartment(user.department || 'Computer Science');
      setYear(user.year || '1st Year');
      setContactDetails(user.contactDetails || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    try {
      // 1. Update MongoDB profile
      await userAPI.updateProfile({
        name: name.trim(),
        department,
        year,
        contactDetails: contactDetails.trim(),
      });

      // 2. If Mock Auth is active, sync with LocalStorage
      if (!isClerkEnabled) {
        const mockUserStr = localStorage.getItem('campustrade_mock_user');
        if (mockUserStr) {
          const parsed = JSON.parse(mockUserStr);
          const updated = {
            ...parsed,
            name: name.trim(),
            department,
            year,
            contactDetails: contactDetails.trim(),
          };
          localStorage.setItem('campustrade_mock_user', JSON.stringify(updated));
        }
      }

      // 3. Refresh user state
      await refreshDbUser();
      setSuccess(true);
      
      // Auto fade success message
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-white">Please log in</h2>
        <p className="text-xs text-dark-450 mt-1">You must be logged in to view and edit your profile settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 space-y-8 relative">
      <div className="absolute top-0 right-10 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>

      {/* Header */}
      <div className="border-b border-dark-850 pb-5">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          Profile Settings
          <Sparkles className="h-5 w-5 text-brand-400" />
        </h1>
        <p className="text-xs text-dark-400 mt-1">Provide your department and contact information so classmates can reach you easily.</p>
      </div>

      {/* Messages */}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/25 text-green-400 text-xs rounded-2xl flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-2xl flex items-center gap-2.5">
          <span>{error}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 rounded-3xl border border-dark-850 space-y-6">
        
        {/* Profile Card Header Info */}
        <div className="flex items-center gap-4 pb-6 border-b border-dark-800/80">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/10 border border-brand-500/25 flex items-center justify-center font-extrabold text-brand-400 text-2xl uppercase">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">{user?.name}</h3>
            <p className="text-xs text-dark-450 mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold text-dark-355 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User className="h-4 w-4 text-brand-400" /> Full Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 focus:outline-none rounded-xl py-3 px-4 text-white text-sm transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-dark-355 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-brand-400" /> Academic Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 focus:outline-none rounded-xl py-3 px-4 text-white text-sm transition-colors cursor-pointer"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept} className="bg-dark-900">{dept}</option>
              ))}
            </select>
          </div>

          {/* Year of study */}
          <div>
            <label className="block text-xs font-semibold text-dark-355 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-brand-400" /> Year of Study
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 focus:outline-none rounded-xl py-3 px-4 text-white text-sm transition-colors cursor-pointer"
            >
              {YEARS.map((yr) => (
                <option key={yr} value={yr} className="bg-dark-900">{yr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact Details (hostel / phone / whatsapp / discord) */}
        <div>
          <label className="block text-xs font-semibold text-dark-355 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-brand-400" /> Contact Details (Visible to logged-in buyers)
          </label>
          <textarea
            rows="3"
            placeholder="e.g. WhatsApp: +1 (555) 019-2834, Hostel Block B Room 402, or Instagram: @myhandle"
            value={contactDetails}
            onChange={(e) => setContactDetails(e.target.value)}
            className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 focus:outline-none rounded-xl py-3 px-4 text-white text-sm transition-colors resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-dark-800/80 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-500 disabled:bg-dark-850 disabled:text-dark-500 text-white font-semibold py-3 px-6 rounded-xl text-xs transition-all shadow-md shadow-brand-600/10 flex items-center gap-2"
          >
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
