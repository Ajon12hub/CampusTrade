import axios from 'axios';

// Set baseURL based on env, fallback to localhost:5000
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Setup dynamic request interceptor to attach authentication tokens
let clerkGetTokenRef = null;

export const setClerkTokenFetcher = (tokenFetcher) => {
  clerkGetTokenRef = tokenFetcher;
};

API.interceptors.request.use(
  async (config) => {
    // 1. Check if Clerk token fetcher is registered (Real Clerk Auth Mode)
    if (clerkGetTokenRef) {
      try {
        const token = await clerkGetTokenRef();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return config;
        }
      } catch (err) {
        console.error('Error fetching Clerk token', err);
      }
    }

    // 2. Fallback: Mock Auth Mode
    // Retrieve mock user from localStorage
    const mockUserStr = localStorage.getItem('campustrade_mock_user');
    if (mockUserStr) {
      try {
        const mockUser = JSON.parse(mockUserStr);
        // Structure: mock_[clerkId]|[email]|[name]
        const mockToken = `mock_${mockUser.clerkId}|${mockUser.email}|${mockUser.name}`;
        config.headers.Authorization = `Bearer ${mockToken}`;
      } catch (err) {
        console.error('Error reading mock user token', err);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API Endpoints
export const productAPI = {
  getProducts: (params) => API.get('/products', { params }),
  getProductById: (id) => API.get(`/products/${id}`),
  createProduct: (productData) => API.post('/products', productData),
  updateProduct: (id, productData) => API.put(`/products/${id}`, productData),
  deleteProduct: (id) => API.delete(`/products/${id}`),
  markAsSold: (id, buyerEmail) => API.patch(`/products/${id}/sold`, { buyerEmail }),
};

export const userAPI = {
  getProfile: () => API.get('/users/profile'),
  updateProfile: (profileData) => API.put('/users/profile', profileData),
  toggleWishlist: (productId) => API.post(`/users/wishlist/${productId}`),
  getDashboard: () => API.get('/users/dashboard'),
  
  // Admin-only calls
  getAllUsers: () => API.get('/users'),
  deleteUser: (id) => API.delete(`/users/${id}`),
};

export const chatAPI = {
  getChatThreads: () => API.get('/chats'),
  getChatMessages: (productId, otherUserId) => API.get(`/chats/${productId}/${otherUserId}`),
  sendMessage: (messageData) => API.post('/chats', messageData),
};

export default API;
