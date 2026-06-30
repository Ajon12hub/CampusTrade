import React, { useState, useEffect } from 'react';
import { useAppAuth } from '../hooks/useAppAuth';
import { userAPI, productAPI } from '../services/api';
import { Shield, Users, Tag, Trash2, Mail, ShieldAlert, BookOpen, AlertCircle } from 'lucide-react';

export default function Admin() {
  const { isSignedIn, user } = useAppAuth();
  
  // Tab control
  const [activeTab, setActiveTab] = useState('users');
  
  // Data lists
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAdminData = async () => {
    if (!isSignedIn || !user?.isAdmin) return;
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'users') {
        const res = await userAPI.getAllUsers();
        setUsers(res.data);
      } else {
        const res = await productAPI.getProducts({ includeSold: true });
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError('Failed to load administrative directories. Make sure your account has admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [isSignedIn, activeTab]);

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}" and all of their active marketplace listings? This cannot be undone.`)) {
      return;
    }

    try {
      await userAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      alert(`User "${userName}" has been removed.`);
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert(err.response?.data?.message || 'Failed to remove user.');
    }
  };

  const handleDeleteListing = async (productId, productName) => {
    if (!window.confirm(`Delete the listing for "${productName}"?`)) {
      return;
    }

    try {
      await productAPI.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      alert('Listing has been removed.');
    } catch (err) {
      console.error('Failed to delete listing:', err);
      alert('Failed to remove listing.');
    }
  };

  // Deny access if not admin
  if (!isSignedIn || !user?.isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto text-red-500 animate-pulse">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-dark-450 max-w-sm mx-auto leading-relaxed">
          The Admin Panel is reserved for moderators. If this is a mistake, verify your email credentials or administrator status in MongoDB.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      
      {/* Admin header */}
      <div className="border-b border-dark-850 pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-400" />
            Admin Panel
          </h1>
          <p className="text-xs text-dark-400 mt-1">Global management of marketplace listings, categories, and users.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-dark-800 gap-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'users' ? 'border-indigo-500 text-indigo-400 font-semibold' : 'border-transparent text-dark-400 hover:text-dark-100'
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          Manage Students ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'products' ? 'border-indigo-500 text-indigo-400 font-semibold' : 'border-transparent text-dark-400 hover:text-dark-100'
          }`}
        >
          <Tag className="h-4.5 w-4.5" />
          Manage Listings ({products.length})
        </button>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-dark-850 overflow-hidden">
          
          {/* ==================== USERS TAB PANEL ==================== */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-dark-950/65 text-dark-355 uppercase font-bold border-b border-dark-800/80">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">College Email</th>
                    <th className="py-4 px-6">Department</th>
                    <th className="py-4 px-6">Year</th>
                    <th className="py-4 px-6">Admin?</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-850/60">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-dark-900/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-white">{u.name}</td>
                      <td className="py-4 px-6 text-dark-300">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-indigo-400" />
                          {u.email}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-dark-300">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5 text-dark-450" />
                          {u.department || 'Not completed'}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-dark-300">{u.year || 'Not completed'}</td>
                      <td className="py-4 px-6">
                        {u.isAdmin ? (
                          <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 uppercase">
                            Yes
                          </span>
                        ) : (
                          <span className="text-dark-500 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {u._id !== user._id ? (
                          <button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="p-2 rounded-xl text-dark-450 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete student account"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-dark-500 font-semibold italic pr-2">Logged In</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ==================== LISTINGS TAB PANEL ==================== */}
          {activeTab === 'products' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-dark-950/65 text-dark-355 uppercase font-bold border-b border-dark-800/80">
                    <th className="py-4 px-6">Product</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Condition</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-6">Seller</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-850/60">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-dark-900/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-white max-w-[200px] truncate">{p.name}</td>
                      <td className="py-4 px-6 text-dark-300">{p.category}</td>
                      <td className="py-4 px-6 text-dark-300">{p.condition}</td>
                      <td className="py-4 px-6 font-extrabold text-indigo-400">₹{p.price}</td>
                      <td className="py-4 px-6 text-dark-300">{p.seller?.name || 'Unknown'}</td>
                      <td className="py-4 px-6">
                        {p.isSold ? (
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase">
                            Sold
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDeleteListing(p._id, p.name)}
                          className="p-2 rounded-xl text-dark-450 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete product listing"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
