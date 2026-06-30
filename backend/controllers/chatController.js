import Message from '../models/Message.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Send a message
// @route   POST /api/chats
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, productId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !productId || !content || !content.trim()) {
      return res.status(400).json({ message: 'Missing message details' });
    }

    // Verify receiver and product exist
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product listing not found' });
    }

    // A student cannot chat with themselves
    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({ message: 'You cannot send a message to yourself' });
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      product: productId,
      content: content.trim(),
    });

    const savedMessage = await message.save();
    
    // Populate sender and receiver for responsive UI updates
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('sender', 'name email department')
      .populate('receiver', 'name email department')
      .populate('product', 'name price images');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// @desc    Get all chat threads (inbox)
// @route   GET /api/chats
// @access  Private
export const getChatThreads = async (req, res) => {
  try {
    const userId = req.user._id;

    // Retrieve all messages involving the current user
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate('sender', 'name email department')
      .populate('receiver', 'name email department')
      .populate('product', 'name price images isSold')
      .sort({ createdAt: -1 });

    const threads = {};

    messages.forEach((msg) => {
      if (!msg.product) return; // skip messages for deleted products
      
      const otherUser = msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender;
      if (!otherUser) return; // skip if other user was deleted
      
      const threadId = `${msg.product._id}-${otherUser._id}`;

      if (!threads[threadId]) {
        threads[threadId] = {
          threadId,
          product: msg.product,
          otherUser: {
            _id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
            department: otherUser.department,
          },
          lastMessage: msg,
          unreadCount: !msg.read && msg.receiver._id.toString() === userId.toString() ? 1 : 0,
        };
      } else {
        // If message is newer, it is already captured due to descending sort.
        // We accumulate unread messages for this thread.
        if (!msg.read && msg.receiver._id.toString() === userId.toString()) {
          threads[threadId].unreadCount += 1;
        }
      }
    });

    // Convert threads object into array sorted by latest message timestamp
    const sortedThreads = Object.values(threads).sort(
      (a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );

    res.json(sortedThreads);
  } catch (error) {
    console.error('Error retrieving chat threads:', error);
    res.status(500).json({ message: 'Failed to fetch chat inbox' });
  }
};

// @desc    Get message history for a specific thread
// @route   GET /api/chats/:productId/:otherUserId
// @access  Private
export const getChatMessages = async (req, res) => {
  try {
    const { productId, otherUserId } = req.params;
    const userId = req.user._id;

    // Find message history between users for the product
    const messages = await Message.find({
      product: productId,
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ createdAt: 1 });

    // Mark messages received by current user in this thread as read
    await Message.updateMany(
      {
        product: productId,
        sender: otherUserId,
        receiver: userId,
        read: false,
      },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error retrieving conversation:', error);
    res.status(500).json({ message: 'Failed to fetch message history' });
  }
};
