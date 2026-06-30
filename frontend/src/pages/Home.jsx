import React, { useState, useEffect } from 'react';
import { productAPI, userAPI } from '../services/api';
import { useAppAuth } from '../hooks/useAppAuth';
import ProductCard from '../components/ProductCard';
import { Search, SlidersHorizontal, ArrowUpDown, HelpCircle, Book, Monitor, Paperclip, Armchair, Calculator, Clipboard, Home as HomeIcon, LayoutGrid, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { name: 'All', icon: LayoutGrid },
  { name: 'Books', icon: Book },
  { name: 'Electronics', icon: Monitor },
  { name: 'Stationery', icon: Paperclip },
  { name: 'Furniture', icon: Armchair },
  { name: 'Calculators', icon: Calculator },
  { name: 'Lab Equipment', icon: Clipboard },
  { name: 'Hostel Essentials', icon: HomeIcon },
  { name: 'Others', icon: HelpCircle },
];

export default function Home() {
  const { isSignedIn } = useAppAuth();
  
  // Products and wishlist states
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [condition, setCondition] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const loadMarketplaceData = async () => {
    setLoading(true);
    try {
      // 1. Fetch products with filters
      const params = {
        search: search.trim() || undefined,
        category: category !== 'All' ? category : undefined,
        condition: condition !== 'All' ? condition : undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sort,
      };
      
      const productRes = await productAPI.getProducts(params);
      setProducts(productRes.data);

      // 2. Fetch user's wishlist IDs if signed in
      if (isSignedIn) {
        const profileRes = await userAPI.getProfile();
        const ids = profileRes.data.wishlist.map(item => typeof item === 'object' ? item._id : item);
        setWishlistIds(ids);
      }
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search/filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMarketplaceData();
    }, 300); // Debounce search changes

    return () => clearTimeout(timer);
  }, [search, category, condition, sort, minPrice, maxPrice, isSignedIn]);

  const handleWishlistChangeInCard = (productId, isWishlisted) => {
    setWishlistIds(prev => 
      isWishlisted 
        ? [...prev, productId] 
        : prev.filter(id => id !== productId)
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 relative">
      
      {/* Glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>

      {/* Hero Header */}
      <div className="text-center md:text-left md:flex items-center justify-between gap-6 py-6 border-b border-dark-850">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl flex items-center justify-center md:justify-start gap-2">
            Campus Marketplace
            <Sparkles className="h-6 w-6 text-brand-400 animate-float" />
          </h1>
          <p className="mt-2 text-sm text-dark-400">
            Buy, sell, swap, or donate textbooks, tech, hostel items, and essentials inside your campus.
          </p>
        </div>
      </div>

      {/* Category Navigation Bar (Horizontal Tab bar) */}
      <div className="flex gap-2 overflow-x-auto pb-3 pt-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const IconComponent = cat.icon;
          const isSelected = category === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setCategory(cat.name)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-semibold border whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-brand-600 border-brand-500 text-white shadow-md shadow-brand-600/10'
                  : 'bg-dark-900 border-dark-800 text-dark-300 hover:text-white hover:border-dark-750'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-dark-450" />
          <input
            type="text"
            placeholder="Search textbook name, lab coats, calculators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 focus:outline-none rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white transition-colors"
          />
        </div>

        {/* Filter Toggle Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 border rounded-2xl text-xs font-bold transition-all ${
              showFilters
                ? 'bg-brand-500/10 border-brand-500 text-brand-400'
                : 'bg-dark-900 border-dark-800 text-dark-300 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(condition !== 'All' || minPrice || maxPrice) && (
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            )}
          </button>

          <div className="relative flex items-center bg-dark-900 border border-dark-800 rounded-2xl px-3">
            <ArrowUpDown className="h-4 w-4 text-dark-450 mr-2" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-xs font-bold text-dark-250 focus:outline-none pr-4 py-2 cursor-pointer"
            >
              <option value="newest" className="bg-dark-900">Newest First</option>
              <option value="priceAsc" className="bg-dark-900">Price: Low to High</option>
              <option value="priceDesc" className="bg-dark-900">Price: High to Low</option>
              <option value="oldest" className="bg-dark-900">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="glass-panel p-6 rounded-2xl animate-fade-in grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Condition Filter */}
          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Item Condition</label>
            <div className="flex flex-wrap gap-2">
              {['All', 'New', 'Good', 'Fair', 'Used'].map((cond) => (
                <button
                  key={cond}
                  onClick={() => setCondition(cond)}
                  className={`px-3.5 py-2 text-xs rounded-xl font-medium border transition-colors ${
                    condition === cond
                      ? 'bg-brand-600/10 border-brand-500 text-brand-400'
                      : 'bg-dark-950 border-dark-800 text-dark-400 hover:text-dark-200'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Price Budget</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-dark-500">₹</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 focus:border-brand-500 focus:outline-none rounded-xl py-2 pl-7 pr-3 text-xs text-white"
                />
              </div>
              <span className="text-dark-500 text-sm">—</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-dark-500">₹</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 focus:border-brand-500 focus:outline-none rounded-xl py-2 pl-7 pr-3 text-xs text-white"
                />
              </div>
              <button
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  setCondition('All');
                }}
                className="text-xs font-semibold text-dark-450 hover:text-brand-400 py-2 px-3 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel rounded-2xl aspect-[4/5] animate-pulse flex flex-col justify-between p-4 border border-dark-850">
              <div className="w-full aspect-[4/3] bg-dark-850 rounded-xl"></div>
              <div className="h-4 bg-dark-850 w-2/3 rounded-lg mt-3"></div>
              <div className="h-3 bg-dark-850 w-full rounded-lg mt-2"></div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-dark-800">
                <div className="h-6 bg-dark-850 w-1/4 rounded-lg"></div>
                <div className="h-5 bg-dark-850 w-1/3 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="glass-panel text-center py-16 px-6 rounded-3xl max-w-xl mx-auto border border-dark-850">
          <p className="text-base font-bold text-white">No items found</p>
          <p className="text-xs text-dark-450 mt-2 leading-relaxed">
            We couldn't find anything matching your filters or search keywords. Try adjusting your query or category select.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              initialWishlisted={wishlistIds.includes(product._id)}
              onWishlistChange={handleWishlistChangeInCard}
            />
          ))}
        </div>
      )}
    </div>
  );
}
