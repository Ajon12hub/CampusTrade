import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useAppAuth } from '../hooks/useAppAuth';
import { Plus, X, Image as ImageIcon, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

const CATEGORIES = ['Books', 'Electronics', 'Stationery', 'Furniture', 'Calculators', 'Lab Equipment', 'Hostel Essentials', 'Others'];
const CONDITIONS = ['New', 'Good', 'Fair', 'Used'];

export default function AddEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, user } = useAppAuth();
  const isEditMode = !!id;

  // Form Fields State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Books');
  const [condition, setCondition] = useState('Good');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [exchangeOption, setExchangeOption] = useState(false);
  
  // Image URLs list state
  const [imageInput, setImageInput] = useState('');
  const [images, setImages] = useState([]);
  
  // App States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch listing data if in Edit Mode
  useEffect(() => {
    if (!isSignedIn) {
      navigate('/login');
      return;
    }

    if (isEditMode) {
      const fetchProductDetails = async () => {
        setLoading(true);
        try {
          const response = await productAPI.getProductById(id);
          const product = response.data;
          
          // Verify ownership or admin privileges
          const productSellerId = product.seller._id || product.seller;
          const currentUserId = user._id || user.id;
          
          if (productSellerId.toString() !== currentUserId.toString() && !user.isAdmin) {
            alert('Not authorized to edit this listing');
            navigate('/');
            return;
          }

          setName(product.name);
          setCategory(product.category);
          setCondition(product.condition);
          setPrice(product.price);
          setDescription(product.description);
          setExchangeOption(product.exchangeOption);
          setImages(product.images || []);
        } catch (err) {
          console.error('Failed to load product for editing:', err);
          setError('Failed to load listing data.');
        } finally {
          setLoading(false);
        }
      };

      fetchProductDetails();
    }
  }, [id, isEditMode, isSignedIn]);

  const handleAddImage = (e) => {
    e.preventDefault();
    if (!imageInput.trim()) return;
    
    // Quick validation for URL format
    if (!imageInput.startsWith('http://') && !imageInput.startsWith('https://') && !imageInput.startsWith('data:image/')) {
      setError('Please enter a valid image URL (starting with http/https) or Base64 data');
      return;
    }

    setImages((prev) => [...prev, imageInput.trim()]);
    setImageInput('');
    setError('');
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !description.trim() || price === '') {
      setError('Please complete all required fields.');
      return;
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setError('Please enter a valid positive price.');
      return;
    }

    setSubmitting(true);
    const productPayload = {
      name: name.trim(),
      category,
      condition,
      price: numericPrice,
      description: description.trim(),
      exchangeOption,
      images,
    };

    try {
      if (isEditMode) {
        await productAPI.updateProduct(id, productPayload);
        alert('Product listing updated successfully!');
      } else {
        await productAPI.createProduct(productPayload);
        alert('Product listing created successfully!');
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving product listing:', err);
      setError(err.response?.data?.message || 'Server error occurred while saving listing.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8 relative">
      <div className="absolute top-10 left-10 w-72 h-72 bg-brand-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="border-b border-dark-850 pb-4">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          {isEditMode ? 'Edit Product Listing' : 'List New Campus Item'}
          <Sparkles className="h-5 w-5 text-brand-400" />
        </h1>
        <p className="text-xs text-dark-400 mt-1">
          Provide accurate details about your item to help students find and buy it quickly.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-2xl flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 rounded-3xl border border-dark-850 space-y-6">
        
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-dark-350 uppercase tracking-wider mb-2">
            Product Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. HC Verma Physics Vol 1, CASIO fx-991EX Calculator"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 focus:outline-none rounded-xl py-3 px-4 text-white text-sm transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-dark-355 uppercase tracking-wider mb-2">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 focus:outline-none rounded-xl py-3 px-4 text-white text-sm transition-colors cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-dark-900">{cat}</option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-semibold text-dark-355 uppercase tracking-wider mb-2">Condition *</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 focus:outline-none rounded-xl py-3 px-4 text-white text-sm transition-colors cursor-pointer"
            >
              {CONDITIONS.map((cond) => (
                <option key={cond} value={cond} className="bg-dark-900">{cond}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-dark-355 uppercase tracking-wider mb-2">
              Price (INR) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-dark-500">₹</span>
              <input
                type="number"
                required
                min="0"
                placeholder="0 for donation/free"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 focus:outline-none rounded-xl py-3 pl-8 pr-4 text-white text-sm transition-colors"
              />
            </div>
          </div>

          {/* Exchange Toggle */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-3 bg-dark-900/40 hover:bg-dark-900 border border-dark-800/80 rounded-xl p-3.5 cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={exchangeOption}
                onChange={(e) => setExchangeOption(e.target.checked)}
                className="w-4 h-4 text-brand-500 bg-dark-900 border-dark-800 rounded focus:ring-brand-500 focus:ring-opacity-25"
              />
              <div>
                <span className="text-xs font-bold text-white block">Open to Exchange / Swap</span>
                <span className="text-[10px] text-dark-450">Tick this if you are willing to trade for other books/items.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-dark-355 uppercase tracking-wider mb-2">
            Item Description *
          </label>
          <textarea
            required
            rows="4"
            placeholder="Describe the condition, usage period, highlights (e.g. written notes, highlight marks), and meeting location on campus."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 focus:outline-none rounded-xl py-3 px-4 text-white text-sm transition-colors resize-none"
          />
        </div>

        {/* Image upload URLs panel */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark-355 uppercase tracking-wider mb-1">Product Images</label>
            <span className="text-[10px] text-dark-500 block mb-3">Add image URLs from Unsplash, Google Photos, or web links to show your product.</span>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-500" />
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo..."
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-800 focus:border-brand-500 focus:outline-none rounded-xl py-2.5 pl-11 pr-4 text-xs text-white transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={handleAddImage}
                className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 rounded-xl text-xs transition-colors flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>

          {/* Thumbnails grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-3 bg-dark-950 rounded-2xl border border-dark-850">
              {images.map((imgUrl, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group bg-dark-900 border border-dark-800">
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-dark-800/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-dark-800 hover:bg-dark-900 rounded-xl text-xs font-bold text-dark-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-600 hover:bg-brand-500 disabled:bg-dark-800 disabled:text-dark-500 text-white font-semibold py-3 px-6 rounded-xl text-xs transition-all shadow-md shadow-brand-600/10 flex items-center gap-2"
          >
            {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
