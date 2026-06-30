import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productAPI, userAPI } from '../services/api';
import { useAppAuth } from '../hooks/useAppAuth';
import { MessageSquare, Heart, Edit, Trash2, ShieldCheck, Mail, BookOpen, GraduationCap, MapPin, RefreshCw, Sparkles, PhoneCall, Camera } from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, user } = useAppAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getProductById(id);
      setProduct(response.data);

      if (isSignedIn) {
        const profileRes = await userAPI.getProfile();
        const ids = profileRes.data.wishlist.map((item) => typeof item === 'object' ? item._id : item);
        setWishlisted(ids.includes(response.data._id));
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id, isSignedIn]);

  const handleToggleWishlist = async () => {
    if (!isSignedIn) {
      alert('Please log in to save items to your wishlist!');
      return;
    }

    setTogglingWishlist(true);
    try {
      const response = await userAPI.toggleWishlist(product._id);
      setWishlisted(response.data.isWishlisted);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setTogglingWishlist(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!window.confirm('Are you sure you want to delete this listing permanently? This cannot be undone.')) {
      return;
    }

    try {
      await productAPI.deleteProduct(product._id);
      alert('Listing deleted successfully.');
      navigate('/');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete listing.');
    }
  };

  // Redirect to dashboard messages tab with params
  const handleChatSeller = () => {
    if (!isSignedIn) {
      navigate(`/login?redirect=/products/${product._id}`);
      return;
    }
    navigate(`/dashboard?tab=messages&productId=${product._id}&partnerId=${product.seller._id}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 text-center">
        <h2 className="text-xl font-bold text-white">Product not found</h2>
        <p className="text-xs text-dark-450 mt-2">The listing might have been removed or is no longer available.</p>
        <Link to="/" className="inline-block mt-4 text-xs font-bold text-brand-400 hover:underline">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isOwner = user && product.seller && (product.seller.clerkId === user.clerkId || product.seller._id === user._id);
  const isAdmin = user && user.isAdmin;

  const productImages = product.images && product.images.length > 0
    ? product.images
    : [];

  const conditionLabels = {
    'New': { label: 'New (Never opened)', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    'Good': { label: 'Good (Minor wear)', color: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
    'Fair': { label: 'Fair (Notable wear)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    'Used': { label: 'Used (Heavy wear)', color: 'bg-dark-500/20 text-dark-350 border-dark-750' },
  };

  const condObj = conditionLabels[product.condition] || conditionLabels['Good'];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      
      {/* Back button */}
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-dark-400 hover:text-white transition-colors">
        <span>←</span> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Images Grid */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] w-full rounded-3xl overflow-hidden bg-dark-950 border border-dark-850 relative">
            {productImages.length > 0 ? (
              <img
                src={productImages[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<div class="w-full h-full bg-dark-850 flex flex-col items-center justify-center text-dark-500 gap-1"><span class="text-xl">⚠️</span><span class="text-[9px] uppercase tracking-wider font-semibold">Broken Link</span></div>';
                }}
              />
            ) : (
              <div className="w-full h-full bg-dark-900/60 flex flex-col items-center justify-center text-dark-500 gap-2 border-b border-dark-800/50">
                <Camera className="h-12 w-12 text-dark-600 animate-pulse-slow" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-dark-450">No Image Provided</span>
              </div>
            )}
            {product.isSold && (
              <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-xs flex items-center justify-center">
                <span className="flex items-center gap-2 bg-green-500/10 text-green-400 px-6 py-2.5 rounded-2xl text-sm font-extrabold uppercase border border-green-500/25 tracking-widest animate-pulse">
                  <ShieldCheck className="h-5 w-5" />
                  Sold / Exchanged
                </span>
              </div>
            )}
          </div>

          {/* Image thumbnails (if multiple) */}
          {productImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-1">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 aspect-[4/3] rounded-xl overflow-hidden border-2 bg-dark-950 transition-all ${
                    activeImage === idx ? 'border-brand-500' : 'border-dark-850 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Listing parameters and actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-dark-850 space-y-6">
            
            {/* Title & category */}
            <div>
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">{product.category}</span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 leading-tight">{product.name}</h1>
              
              <div className="flex flex-wrap gap-2.5 mt-3">
                <span className={`px-3 py-1 rounded-xl text-xs font-bold border uppercase ${condObj.color}`}>
                  {condObj.label}
                </span>
                {product.exchangeOption && (
                  <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-xl text-xs font-bold uppercase">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Open to Exchange
                  </span>
                )}
              </div>
            </div>

            {/* Price display */}
            <div className="py-4 border-y border-dark-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-dark-500 block uppercase tracking-wider">Listing Price</span>
                <span className="text-3xl font-black text-white">₹{product.price}</span>
              </div>
              {product.price === 0 && (
                <span className="flex items-center gap-1 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-xl text-xs font-bold uppercase border border-green-500/20">
                  <Sparkles className="h-4 w-4" />
                  Free Donation
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Item Description</h3>
              <p className="text-sm text-dark-200 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>

            {/* User CTAs */}
            <div className="space-y-3 pt-2">
              {isOwner ? (
                // Owner actions
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to={`/edit-product/${product._id}`}
                    className="flex items-center justify-center gap-2 bg-dark-850 hover:bg-dark-800 border border-dark-750 text-white font-semibold py-3 px-4 rounded-xl text-xs transition-colors"
                  >
                    <Edit className="h-4.5 w-4.5 text-brand-400" />
                    Edit Listing
                  </Link>
                  <button
                    onClick={handleDeleteListing}
                    className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold py-3 px-4 rounded-xl text-xs transition-colors"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                    Delete
                  </button>
                </div>
              ) : (
                // Buyer actions
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleChatSeller}
                    disabled={product.isSold}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:bg-dark-850 disabled:text-dark-500 text-white font-semibold py-3.5 px-6 rounded-xl text-sm transition-all shadow-lg shadow-brand-600/10"
                  >
                    <MessageSquare className="h-4.5 w-4.5" />
                    Chat with Seller
                  </button>
                  
                  <button
                    onClick={handleToggleWishlist}
                    disabled={togglingWishlist || product.isSold}
                    className={`p-3.5 border rounded-xl flex items-center justify-center transition-all ${
                      wishlisted
                        ? 'bg-red-500/10 border-red-500/25 text-red-400'
                        : 'bg-dark-900 border-dark-800 text-dark-350 hover:text-white hover:border-dark-750'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${wishlisted ? 'fill-red-500' : ''}`} />
                  </button>
                </div>
              )}

              {/* Admin Override Action */}
              {isAdmin && !isOwner && (
                <button
                  onClick={handleDeleteListing}
                  className="w-full mt-3 flex items-center justify-center gap-2 bg-red-650 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors border border-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                  Admin Override: Delete Listing
                </button>
              )}
            </div>
          </div>

          {/* Seller Profile Panel */}
          {product.seller && (
            <div className="glass-panel p-6 rounded-3xl border border-dark-850 space-y-4">
              <h3 className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Seller Profile</h3>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center font-bold text-brand-400 text-lg">
                  {product.seller.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{product.seller.name}</h4>
                  <p className="text-xs text-dark-400 mt-0.5">
                    {product.seller.department || 'No department'} • {product.seller.year || 'No year specified'}
                  </p>
                </div>
              </div>

              {/* Contact Info (Visible if logged in) */}
              {isSignedIn ? (
                <div className="pt-3 border-t border-dark-850/80 space-y-2 text-xs text-dark-200">
                  {product.seller.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-brand-400" />
                      <span>{product.seller.email}</span>
                    </div>
                  )}
                  {product.seller.contactDetails && (
                    <div className="flex items-center gap-2.5">
                      <PhoneCall className="h-4 w-4 text-brand-400" />
                      <span>{product.seller.contactDetails}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-3 border-t border-dark-850/80 text-xs text-dark-450 italic flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-brand-500/50" />
                  <span>Log in to view college contact details.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
