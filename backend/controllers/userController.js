import User from '../models/User.js';
import Product from '../models/Product.js';

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist')
      .populate({
        path: 'purchasedItems',
        populate: { path: 'seller', select: 'name email department' }
      });
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error retrieving profile' });
  }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, department, year, contactDetails } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name !== undefined ? name : user.name;
    user.department = department !== undefined ? department : user.department;
    user.year = year !== undefined ? year : user.year;
    user.contactDetails = contactDetails !== undefined ? contactDetails : user.contactDetails;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// @desc    Toggle product in wishlist (Add/Remove)
// @route   POST /api/users/wishlist/:productId
// @access  Private
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const index = user.wishlist.indexOf(productId);
    let message = '';
    let isWishlisted = false;

    if (index === -1) {
      // Add to wishlist
      user.wishlist.push(productId);
      message = 'Product added to wishlist';
      isWishlisted = true;
    } else {
      // Remove from wishlist
      user.wishlist.splice(index, 1);
      message = 'Product removed from wishlist';
      isWishlisted = false;
    }

    await user.save();
    res.json({ message, isWishlisted, wishlist: user.wishlist });
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({ message: 'Error modifying wishlist' });
  }
};

// @desc    Get user dashboard summary
// @route   GET /api/users/dashboard
// @access  Private
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all products listed by this user
    const listings = await Product.find({ seller: userId }).sort({ createdAt: -1 });

    // Get complete user details with populated wishlist and purchases
    const userDetails = await User.findById(userId)
      .populate({
        path: 'wishlist',
        populate: { path: 'seller', select: 'name department contactDetails' }
      })
      .populate({
        path: 'purchasedItems',
        populate: { path: 'seller', select: 'name department contactDetails email' }
      });

    res.json({
      listings,
      wishlist: userDetails ? userDetails.wishlist : [],
      purchasedItems: userDetails ? userDetails.purchasedItems : [],
    });
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    res.status(500).json({ message: 'Error retrieving dashboard summaries' });
  }
};

// ==================== ADMIN ROUTES ====================

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error loading users:', error);
    res.status(500).json({ message: 'Error retrieving user list' });
  }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Do not allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    // Delete user listings
    await Product.deleteMany({ seller: req.params.id });

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User and all associated listings removed' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error removing user' });
  }
};
