import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppAuth } from '../hooks/useAppAuth';
import { userAPI, chatAPI, productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import ChatWindow from '../components/ChatWindow';
import { Tag, MessageSquare, Heart, ShoppingBag, Edit, Trash2, ShieldCheck, Mail, ArrowRight, BookOpen, GraduationCap, CheckCircle2, Camera } from 'lucide-react';

export default function Dashboard() {
  const { isSignedIn, user } = useAppAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Navigation Tabs
  const currentTab = searchParams.get('tab') || 'listings';
  
  // Dashboard Data State
  const [listings, setListings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [purchased, setPurchased] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chat/Inbox States
  const [chatThreads, setChatThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null); // structure: { productId, otherUserId, product, otherUser }
  
  // Buyer sync modal state
  const [showBuyerModal, setShowBuyerModal] = useState(null); // productId if active
  const [buyerEmail, setBuyerEmail] = useState('');
  const [markingSold, setMarkingSold] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/login?redirect=/dashboard');
    }
  }, [isSignedIn]);

  const loadDashboardData = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      // Load listings, wishlist, purchased items
      const dashboardRes = await userAPI.getDashboard();
      setListings(dashboardRes.data.listings);
      setWishlist(dashboardRes.data.wishlist);
      setPurchased(dashboardRes.data.purchasedItems);

      // Load inbox chat threads
      const threadsRes = await chatAPI.getChatThreads();
      setChatThreads(threadsRes.data);

      // Handle deep-linking to specific conversation from query params
      const paramProdId = searchParams.get('productId');
      const paramPartnerId = searchParams.get('partnerId');

      if (paramProdId && paramPartnerId) {
        // Find if thread already exists in active threads
        const existingThread = threadsRes.data.find(
          (t) => t.product._id === paramProdId && t.otherUser._id === paramPartnerId
        );

        if (existingThread) {
          setActiveThread({
            productId: existingThread.product._id,
            otherUserId: existingThread.otherUser._id,
            product: existingThread.product,
            otherUser: existingThread.otherUser,
          });
        } else {
          // If conversation thread is new, fetch the target details to spin it up dynamically
          try {
            const productRes = await productAPI.getProductById(paramProdId);
            const partner = productRes.data.seller; // populated seller profile
            
            setActiveThread({
              productId: paramProdId,
              otherUserId: paramPartnerId,
              product: {
                _id: productRes.data._id,
                name: productRes.data.name,
                price: productRes.data.price,
                images: productRes.data.images,
                isSold: productRes.data.isSold,
                seller: partner._id,
              },
              otherUser: {
                _id: partner._id,
                name: partner.name,
                email: partner.email,
                department: partner.department,
                year: partner.year,
              },
            });
          } catch (err) {
            console.error('Failed to load deep-link chat metadata:', err);
          }
        }
      } else if (threadsRes.data.length > 0 && !activeThread) {
        // Default to first conversation if tab is messages and none selected
        const first = threadsRes.data[0];
        setActiveThread({
          productId: first.product._id,
          otherUserId: first.otherUser._id,
          product: first.product,
          otherUser: first.otherUser,
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isSignedIn, currentTab]);

  const selectTab = (tabName) => {
    // Retain thread search params if switching back to messages
    if (tabName !== 'messages') {
      setSearchParams({ tab: tabName });
    } else if (activeThread) {
      setSearchParams({
        tab: 'messages',
        productId: activeThread.productId,
        partnerId: activeThread.otherUserId
      });
    } else {
      setSearchParams({ tab: 'messages' });
    }
  };

  const handleSelectThread = (thread) => {
    setActiveThread({
      productId: thread.product._id,
      otherUserId: thread.otherUser._id,
      product: thread.product,
      otherUser: thread.otherUser,
    });
    setSearchParams({
      tab: 'messages',
      productId: thread.product._id,
      partnerId: thread.otherUser._id,
    });
  };

  const handleDeleteListing = async (productId) => {
    if (!window.confirm('Delete this listing permanently?')) return;
    try {
      await productAPI.deleteProduct(productId);
      setListings((prev) => prev.filter((item) => item._id !== productId));
      alert('Listing deleted successfully!');
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleMarkSoldSubmit = async (e) => {
    e.preventDefault();
    if (!showBuyerModal) return;
    setMarkingSold(true);
    try {
      await productAPI.markAsSold(showBuyerModal, buyerEmail.trim() || undefined);
      
      // Update local state
      setListings(prev => 
        prev.map(item => item._id === showBuyerModal ? { ...item, isSold: true } : item)
      );

      alert('Listing marked as sold/exchanged successfully!');
      setShowBuyerModal(null);
      setBuyerEmail('');
    } catch (err) {
      console.error('Error marking sold:', err);
      alert('Failed to update listing status.');
    } finally {
      setMarkingSold(false);
    }
  };

  const tabs = [
    { id: 'listings', name: 'My Listings', icon: Tag },
    { id: 'messages', name: 'Messages', icon: MessageSquare, badge: chatThreads.reduce((sum, t) => sum + t.unreadCount, 0) },
    { id: 'wishlist', name: 'Wishlist', icon: Heart },
    { id: 'purchased', name: 'Purchased Items', icon: ShoppingBag },
  ];

  if (loading && listings.length === 0 && chatThreads.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      
      {/* Dashboard Header */}
      <div className="border-b border-dark-850 pb-5">
        <h1 className="text-2xl font-extrabold text-white">Student Dashboard</h1>
        <p className="text-xs text-dark-400 mt-1">Manage listings, chat with buyers, and view your campus swap records.</p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-dark-800 overflow-x-auto scrollbar-none gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'border-brand-500 text-brand-400 font-semibold'
                  : 'border-transparent text-dark-400 hover:text-dark-100'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {tab.name}
              {tab.badge > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-brand-500 text-[10px] text-white font-extrabold animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px]">
        
        {/* ================== MY LISTINGS PANEL ================== */}
        {currentTab === 'listings' && (
          <div className="space-y-6">
            {listings.length === 0 ? (
              <div className="glass-panel text-center py-16 px-6 rounded-3xl max-w-xl mx-auto border border-dark-850">
                <p className="text-sm font-bold text-white">No active listings</p>
                <p className="text-xs text-dark-450 mt-1.5 mb-4">You haven't listed any items for sale or donation yet.</p>
                <button
                  onClick={() => navigate('/add-product')}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors"
                >
                  List Your First Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((item) => (
                  <div
                    key={item._id}
                    className="glass-panel p-5 rounded-2xl border border-dark-850 flex gap-4 items-start relative glow-card"
                  >
                    {item.images && item.images.length > 0 && item.images[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover border border-dark-800 bg-dark-950"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-dark-950 border border-dark-850 flex flex-col items-center justify-center text-dark-550 gap-0.5">
                        <Camera className="h-6 w-6 text-dark-600" />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-center">No Image</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest">{item.category}</span>
                        {item.isSold ? (
                          <span className="flex items-center gap-1 bg-green-500/15 text-green-400 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border border-green-500/20">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Sold
                          </span>
                        ) : (
                          <span className="bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border border-brand-500/20">
                            Active
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-bold text-white mt-1.5 truncate">{item.name}</h3>
                      <p className="text-xs text-brand-400 font-bold mt-1">₹{item.price}</p>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-dark-800/80">
                        <button
                          onClick={() => navigate(`/edit-product/${item._id}`)}
                          className="flex items-center gap-1 text-xs text-dark-300 hover:text-white transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteListing(item._id)}
                          className="flex items-center gap-1 text-xs text-dark-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                        {!item.isSold && (
                          <button
                            onClick={() => setShowBuyerModal(item._id)}
                            className="ml-auto bg-brand-600 hover:bg-brand-500 text-white font-semibold py-1.5 px-3 rounded-lg text-[10px] transition-colors"
                          >
                            Mark Sold
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================== MESSAGES PANEL ================== */}
        {currentTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Sidebar Threads list */}
            <div className="lg:col-span-4 bg-dark-900 border border-dark-800 rounded-2xl p-4 overflow-y-auto max-h-[550px] space-y-2">
              <h3 className="text-xs font-bold text-dark-300 uppercase tracking-widest px-2 mb-3">Chats Inbox</h3>
              
              {chatThreads.length === 0 ? (
                <div className="text-center py-10 text-xs text-dark-450 italic">
                  No active conversations found.
                </div>
              ) : (
                chatThreads.map((thread) => {
                  const isSelected = activeThread && activeThread.productId === thread.product._id && activeThread.otherUserId === thread.otherUser._id;
                  return (
                    <button
                      key={thread.threadId}
                      onClick={() => handleSelectThread(thread)}
                      className={`w-full text-left p-3 rounded-xl border flex gap-3 items-center transition-colors relative ${
                        isSelected
                          ? 'bg-brand-600/10 border-brand-500/40 text-white'
                          : 'bg-dark-950/40 border-transparent hover:bg-dark-850 hover:border-dark-800'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center font-bold text-brand-400 uppercase">
                        {thread.otherUser.name.charAt(0)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-white leading-none truncate max-w-[120px]">{thread.otherUser.name}</h4>
                          <span className="text-[9px] text-dark-500">
                            {new Date(thread.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-dark-400 mt-1 truncate">Item: {thread.product.name}</p>
                        <p className="text-[10px] text-dark-450 italic mt-0.5 truncate">{thread.lastMessage.content}</p>
                      </div>

                      {thread.unreadCount > 0 && (
                        <span className="absolute right-3 bottom-3 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-[10px] text-white font-extrabold">
                          {thread.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Chat Window Panel */}
            <div className="lg:col-span-8">
              {activeThread ? (
                <ChatWindow
                  productId={activeThread.productId}
                  otherUserId={activeThread.otherUserId}
                  productInfo={activeThread.product}
                  otherUserInfo={activeThread.otherUser}
                  onMessageSent={loadDashboardData}
                />
              ) : (
                <div className="h-[550px] bg-dark-900 border border-dark-800 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                  <MessageSquare className="h-10 w-10 text-dark-550 mb-3 animate-float" />
                  <h3 className="text-sm font-bold text-white">Select a conversation</h3>
                  <p className="text-xs text-dark-450 mt-1 max-w-xs leading-relaxed">
                    Select a conversation from the sidebar inbox to read and send messages.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================== WISHLIST PANEL ================== */}
        {currentTab === 'wishlist' && (
          <div className="space-y-6">
            {wishlist.length === 0 ? (
              <div className="glass-panel text-center py-16 px-6 rounded-3xl max-w-xl mx-auto border border-dark-850">
                <Heart className="h-10 w-10 text-dark-550 mx-auto mb-3" />
                <p className="text-sm font-bold text-white">Your wishlist is empty</p>
                <p className="text-xs text-dark-450 mt-1.5 mb-4">Browse products in the marketplace and click the heart icon to save them.</p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors"
                >
                  Explore Marketplace
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wishlist.map((item) => (
                  <ProductCard
                    key={item._id}
                    product={item}
                    initialWishlisted={true}
                    onWishlistChange={loadDashboardData}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================== PURCHASED ITEMS PANEL ================== */}
        {currentTab === 'purchased' && (
          <div className="space-y-6">
            {purchased.length === 0 ? (
              <div className="glass-panel text-center py-16 px-6 rounded-3xl max-w-xl mx-auto border border-dark-850">
                <ShoppingBag className="h-10 w-10 text-dark-550 mx-auto mb-3" />
                <p className="text-sm font-bold text-white">No purchases logged</p>
                <p className="text-xs text-dark-450 mt-1">When a seller marks an item as sold to you, it will show up here as a transaction record.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {purchased.map((item) => (
                  <div
                    key={item._id}
                    className="glass-panel p-5 rounded-2xl border border-dark-850 flex gap-4 items-start glow-card"
                  >
                    {item.images && item.images.length > 0 && item.images[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover border border-dark-800 bg-dark-950"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-dark-950 border border-dark-850 flex flex-col items-center justify-center text-dark-550 gap-0.5">
                        <Camera className="h-6 w-6 text-dark-600" />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-center">No Image</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-green-400 uppercase tracking-widest">Transaction Log</span>
                        <span className="flex items-center gap-1 bg-green-500/10 text-green-400 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-green-500/25">
                          <CheckCircle2 className="h-3 w-3" /> Confirmed
                        </span>
                      </div>
                      
                      <h3 className="text-sm font-bold text-white mt-1.5 truncate">{item.name}</h3>
                      <p className="text-xs text-brand-400 font-bold mt-1">Acquired for: ₹{item.price}</p>
                      
                      {item.seller && (
                        <div className="mt-3.5 pt-3 border-t border-dark-850 flex flex-col gap-1 text-[10px] text-dark-400">
                          <span className="font-semibold text-dark-300">Seller details:</span>
                          <span>Name: {item.seller.name}</span>
                          <span>Dept: {item.seller.department}</span>
                          {item.seller.email && (
                            <span className="flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 text-brand-400" />
                              {item.seller.email}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mark Sold Modal (Inputs Buyer Email) */}
      {showBuyerModal && (
        <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-dark-800 p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-white">Mark as Sold</h3>
            <p className="text-xs text-dark-400">
              Provide the buyer's college email to log this transaction in their dashboard. You can leave this blank if you sold it outside the platform.
            </p>
            
            <form onSubmit={handleMarkSoldSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-dark-300 uppercase tracking-wider mb-1.5">
                  Buyer College Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="buyer.student@college.edu"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-805 focus:border-brand-500 focus:outline-none rounded-xl py-3 px-4 text-white text-sm"
                />
              </div>

              <div className="flex gap-2.5 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowBuyerModal(null);
                    setBuyerEmail('');
                  }}
                  className="px-4 py-2 text-xs font-bold border border-dark-800 text-dark-350 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markingSold}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 px-5 rounded-xl text-xs transition-colors"
                >
                  Mark Item as Sold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
