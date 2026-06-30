import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, RefreshCw, Sparkles, Camera } from 'lucide-react';
import { useAppAuth } from '../hooks/useAppAuth';
import { userAPI } from '../services/api';

export default function ProductCard({ product, initialWishlisted = false, onWishlistChange = null }) {
  const { isSignedIn } = useAppAuth();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Return product image if uploaded, or null
  const getProductImage = () => {
    if (product.images && product.images.length > 0 && product.images[0]) {
      return product.images[0];
    }
    return null;
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isSignedIn) {
      alert('Please log in to save items to your wishlist!');
      return;
    }

    setLoadingWishlist(true);
    try {
      const response = await userAPI.toggleWishlist(product._id);
      setIsWishlisted(response.data.isWishlisted);
      if (onWishlistChange) {
        onWishlistChange(product._id, response.data.isWishlisted);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const conditionColors = {
    'New': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Good': 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    'Fair': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Used': 'bg-dark-500/20 text-dark-300 border-dark-700/50',
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-300 glow-card hover:shadow-premium-hover">
      
      {/* Product Image Panel */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-dark-950">
        <Link to={`/products/${product._id}`} className="block w-full h-full">
          {getProductImage() ? (
            <img
              src={getProductImage()}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<div class="w-full h-full bg-dark-850 flex flex-col items-center justify-center text-dark-500 gap-1"><span class="text-xl">⚠️</span><span class="text-[9px] uppercase tracking-wider font-semibold">Broken Link</span></div>';
              }}
            />
          ) : (
            <div className="w-full h-full bg-dark-850 flex flex-col items-center justify-center text-dark-500 gap-1.5 border-b border-dark-800/50">
              <Camera className="h-8 w-8 text-dark-600" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-dark-500">No Image Provided</span>
            </div>
          )}
        </Link>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={loadingWishlist}
          className="absolute top-3 right-3 p-2 rounded-xl bg-dark-900/80 backdrop-blur-sm border border-white/5 hover:border-brand-500/30 text-dark-300 hover:text-red-400 transition-all hover:scale-110 active:scale-95"
        >
          <Heart
            className={`h-4.5 w-4.5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-dark-300'}`}
          />
        </button>

        {/* Condition tag */}
        <span className={`absolute bottom-3 left-3 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${conditionColors[product.condition] || conditionColors['Good']}`}>
          {product.condition}
        </span>

        {/* Category tag */}
        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-dark-900/80 backdrop-blur-sm text-brand-300 border border-white/5">
          {product.category}
        </span>
      </div>

      {/* Product Details Panel */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/products/${product._id}`}>
            <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1.5 text-xs text-dark-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-dark-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-dark-500 block">PRICE</span>
            <span className="text-lg font-black text-brand-400">
              ₹{product.price}
            </span>
          </div>

          <div className="flex gap-2">
            {product.exchangeOption && (
              <span
                className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase"
                title="Seller is open to exchange/swap items"
              >
                <RefreshCw className="h-3 w-3 animate-spin-slow" />
                Swap
              </span>
            )}
            {product.price === 0 && (
              <span className="flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">
                <Sparkles className="h-3 w-3" />
                Free
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
