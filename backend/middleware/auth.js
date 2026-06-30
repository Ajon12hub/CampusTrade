import { createClerkClient, verifyToken } from '@clerk/backend';
import User from '../models/User.js';

// Initialize Clerk Backend client lazily to ensure env vars are loaded first
let clerkClient = null;
const getClerkClient = () => {
  if (!clerkClient) {
    clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    });
  }
  return clerkClient;
};

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    let clerkId;
    let email;
    let name;

    const isClerkConfigured = process.env.CLERK_SECRET_KEY && process.env.CLERK_SECRET_KEY.trim() !== '';

    // Check if we are running in Mock Auth Mode
    if (!isClerkConfigured || token.startsWith('mock_')) {
      // Mock Auth Mode
      // Format of mock token: mock_[clerkId]|[email]|[name]
      if (token.startsWith('mock_')) {
        const parts = token.replace('mock_', '').split('|');
        clerkId = 'mock_' + parts[0];
        email = parts[1] || `${parts[0]}@college.edu`;
        name = parts[2] || parts[0];
      } else {
        // Fallback for missing keys but non-mock token
        clerkId = 'mock_dev_user';
        email = 'dev_user@college.edu';
        name = 'Developer Student';
      }
    } else {
      // Real Clerk Auth Mode
      try {
        // Verify the Clerk session token (JWT signature check)
        const decodedToken = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
          publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
        });
        clerkId = decodedToken.sub;
        
        // Extract claims from token if available
        email = decodedToken.email || '';
        name = decodedToken.name || '';

        // If email or name are missing from the JWT claims, fetch them from the Clerk User API
        if (!email || !name) {
          try {
            const client = getClerkClient();
            const clerkUser = await client.users.getUser(clerkId);
            email = clerkUser.emailAddresses[0]?.emailAddress || '';
            name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Student';
          } catch (apiErr) {
            console.error('Failed to retrieve profile details from Clerk API:', apiErr);
          }
        }
      } catch (err) {
        console.error('Clerk JWT verification failed:', err.message);
        return res.status(401).json({ message: 'Token verification failed: ' + err.message });
      }
    }

    if (!clerkId) {
      return res.status(401).json({ message: 'Unauthorized: No user identifier found' });
    }

    // Find user in MongoDB
    let user = await User.findOne({ clerkId });

    // If user does not exist in MongoDB, create a profile
    if (!user) {
      // Create user automatically
      user = await User.create({
        clerkId,
        email: email || `${clerkId}@college.edu`,
        name: name || 'Marketplace User',
      });
      console.log(`Created new MongoDB User for clerkId: ${clerkId}`);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server authentication error' });
  }
};

// Middleware to check if user is admin
export const requireAdmin = async (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
};
