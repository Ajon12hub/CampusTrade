import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get all products (with search, filters, sorting)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { search, category, condition, minPrice, maxPrice, sort, includeSold } = req.query;

    const query = {};

    // Exclude sold items by default unless specified
    if (includeSold !== 'true') {
      query.isSold = false;
    }

    // Search filter (regex search on name and description)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Condition filter
    if (condition && condition !== 'All') {
      query.condition = condition;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // default: newest
    if (sort) {
      if (sort === 'priceAsc') {
        sortOptions = { price: 1 };
      } else if (sort === 'priceDesc') {
        sortOptions = { price: -1 };
      } else if (sort === 'oldest') {
        sortOptions = { createdAt: 1 };
      }
    }

    const products = await Product.find(query)
      .populate('seller', 'name department year contactDetails email')
      .sort(sortOptions);

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error retrieving products' });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name department year contactDetails email clerkId');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ message: 'Error retrieving product details' });
  }
};

// @desc    Create a product listing
// @route   POST /api/products
// @access  Private
export const createProduct = async (req, res) => {
  try {
    const { name, category, description, price, condition, exchangeOption, images } = req.body;

    if (!name || !category || !description || price === undefined || !condition) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const product = new Product({
      name,
      category,
      description,
      price: Number(price),
      condition,
      exchangeOption: exchangeOption === true || exchangeOption === 'true',
      images: Array.isArray(images) ? images : [],
      seller: req.user._id, // Set the seller to the authenticated MongoDB user
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product listing' });
  }
};

// @desc    Update a product listing
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req, res) => {
  try {
    const { name, category, description, price, condition, exchangeOption, images, isSold } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user is the owner or an admin
    if (product.seller.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    product.name = name !== undefined ? name : product.name;
    product.category = category !== undefined ? category : product.category;
    product.description = description !== undefined ? description : product.description;
    product.price = price !== undefined ? Number(price) : product.price;
    product.condition = condition !== undefined ? condition : product.condition;
    product.exchangeOption = exchangeOption !== undefined ? (exchangeOption === true || exchangeOption === 'true') : product.exchangeOption;
    product.images = images !== undefined ? (Array.isArray(images) ? images : []) : product.images;
    product.isSold = isSold !== undefined ? (isSold === true || isSold === 'true') : product.isSold;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product listing' });
  }
};

// @desc    Delete a product listing
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user is the owner or an admin
    if (product.seller.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Also remove this product from all users' wishlists
    await User.updateMany({ wishlist: req.params.id }, { $pull: { wishlist: req.params.id } });

    res.json({ message: 'Product listing removed successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product listing' });
  }
};

// @desc    Mark a product as sold and optionally add to purchaser
// @route   PATCH /api/products/:id/sold
// @access  Private
export const markProductAsSold = async (req, res) => {
  try {
    const { buyerEmail } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the owner
    if (product.seller.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to modify this listing' });
    }

    product.isSold = true;
    await product.save();

    // If a buyer email is specified, find the buyer and add to purchased items
    if (buyerEmail) {
      const buyer = await User.findOne({ email: buyerEmail.trim().toLowerCase() });
      if (buyer) {
        if (!buyer.purchasedItems.includes(product._id)) {
          buyer.purchasedItems.push(product._id);
          await buyer.save();
        }
      }
    }

    res.json({ message: 'Product marked as sold', product });
  } catch (error) {
    console.error('Error marking product as sold:', error);
    res.status(500).json({ message: 'Error marking product as sold' });
  }
};
