const mongoose = require('mongoose');

// ============================================================
// KONFIGURASI KONEKSI
// ============================================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fluffymd:imamz282011@cluster0.mywborp.mongodb.net/?appName=Cluster0';
const DATABASE_NAME = process.env.DATABASE_NAME || 'fluffy_bot';

// ============================================================
// MODEL USER
// ============================================================
const UserSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true, index: true },
  username: { type: String, default: '' },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  poin: { type: Number, default: 0, min: 0 },
  isPremium: { type: Boolean, default: false },
  premiumExpiry: { type: Date, default: null },
  joinedAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  totalCommands: { type: Number, default: 0 },
  referralCode: { type: String, default: '' },
  referredBy: { type: Number, default: null },
  referrals: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false }
});

// ============================================================
// MODEL PRODUCT
// ============================================================
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  data: { type: String, default: '' }, // link atau file
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ============================================================
// MODEL ORDER
// ============================================================
const OrderSchema = new mongoose.Schema({
  userId: { type: Number, required: true, index: true },
  username: { type: String, default: '' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, default: '' },
  amount: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected'], 
    default: 'pending' 
  },
  proofImage: { type: String, default: '' },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null }
});

// ============================================================
= MODEL
// ============================================================
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);

// ============================================================
// STATUS KONEKSI
// ============================================================
let isConnected = false;

// ============================================================
// FUNGSI KONEKSI
// ============================================================
async function connect() {
  if (isConnected) {
    console.log('ℹ️ Database already connected.');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: DATABASE_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout jika koneksi lambat
    });
    isConnected = true;
    console.log('✅ MongoDB connected successfully!');
    
    // Event listener untuk error setelah koneksi
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error after connect:', err.message);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
      isConnected = false;
      // Coba reconnect setelah 5 detik
      setTimeout(() => {
        if (!isConnected) {
          connect();
        }
      }, 5000);
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    isConnected = false;
    // Jangan throw error agar bot tetap jalan tanpa DB (tapi fitur DB mati)
  }
}

// ============================================================
// FUNGSI DISKONEK
// ============================================================
async function disconnect() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('🔌 MongoDB disconnected.');
  }
}

// ============================================================
// FUNGSI CEK KONEKSI
// ============================================================
function isDbConnected() {
  return isConnected;
}

// ============================================================
// FUNGSI USER
// ============================================================
async function findOrCreateUser(userId, username = '', firstName = '', lastName = '') {
  try {
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({
        userId,
        username: username || '',
        firstName: firstName || '',
        lastName: lastName || '',
        poin: 0,
        joinedAt: new Date()
      });
      await user.save();
      console.log(`✅ New user created: ${userId}`);
    } else {
      // Update last active
      user.lastActive = new Date();
      if (username) user.username = username;
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      await user.save();
    }
    return user;
  } catch (error) {
    console.error('❌ Error findOrCreateUser:', error.message);
    return null;
  }
}

async function getUser(userId) {
  try {
    return await User.findOne({ userId });
  } catch (error) {
    console.error('❌ Error getUser:', error.message);
    return null;
  }
}

async function updateUser(userId, updateData) {
  try {
    const user = await User.findOneAndUpdate(
      { userId },
      { ...updateData, lastActive: new Date() },
      { new: true, runValidators: true }
    );
    return user;
  } catch (error) {
    console.error('❌ Error updateUser:', error.message);
    return null;
  }
}

// ============================================================
// FUNGSI POIN
// ============================================================
async function getPoin(userId) {
  try {
    const user = await User.findOne({ userId });
    return user ? user.poin : 0;
  } catch (error) {
    console.error('❌ Error getPoin:', error.message);
    return 0;
  }
}

async function addPoin(userId, amount) {
  try {
    if (amount <= 0) return false;
    const user = await User.findOne({ userId });
    if (!user) {
      // Buat user baru jika belum ada
      await findOrCreateUser(userId);
      return await addPoin(userId, amount); // Recursive call setelah create
    }
    user.poin = (user.poin || 0) + amount;
    await user.save();
    return true;
  } catch (error) {
    console.error('❌ Error addPoin:', error.message);
    return false;
  }
}

async function subtractPoin(userId, amount) {
  try {
    if (amount <= 0) return false;
    const user = await User.findOne({ userId });
    if (!user) return false;
    if ((user.poin || 0) < amount) return false;
    user.poin -= amount;
    await user.save();
    return true;
  } catch (error) {
    console.error('❌ Error subtractPoin:', error.message);
    return false;
  }
}

async function hasEnoughPoin(userId, required) {
  try {
    const poin = await getPoin(userId);
    return poin >= required;
  } catch (error) {
    console.error('❌ Error hasEnoughPoin:', error.message);
    return false;
  }
}

// ============================================================
// FUNGSI PRODUCT
// ============================================================
async function createProduct(name, price, description = '', data = '') {
  try {
    const product = new Product({
      name,
      price,
      description,
      data,
      active: true
    });
    await product.save();
    return product;
  } catch (error) {
    console.error('❌ Error createProduct:', error.message);
    return null;
  }
}

async function getProduct(productId) {
  try {
    return await Product.findById(productId);
  } catch (error) {
    console.error('❌ Error getProduct:', error.message);
    return null;
  }
}

async function getAllProducts(activeOnly = true) {
  try {
    const filter = activeOnly ? { active: true } : {};
    return await Product.find(filter).sort({ createdAt: -1 });
  } catch (error) {
    console.error('❌ Error getAllProducts:', error.message);
    return [];
  }
}

async function updateProduct(productId, updateData) {
  try {
    const product = await Product.findByIdAndUpdate(
      productId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    return product;
  } catch (error) {
    console.error('❌ Error updateProduct:', error.message);
    return null;
  }
}

async function deleteProduct(productId) {
  try {
    await Product.findByIdAndDelete(productId);
    return true;
  } catch (error) {
    console.error('❌ Error deleteProduct:', error.message);
    return false;
  }
}

// ============================================================
// FUNGSI ORDER
// ============================================================
async function createOrder(userId, username, productId, productName, amount, proofImage = '', note = '') {
  try {
    const order = new Order({
      userId,
      username,
      productId,
      productName,
      amount,
      status: 'pending',
      proofImage,
      note,
      createdAt: new Date()
    });
    await order.save();
    return order;
  } catch (error) {
    console.error('❌ Error createOrder:', error.message);
    return null;
  }
}

async function getOrder(orderId) {
  try {
    return await Order.findById(orderId);
  } catch (error) {
    console.error('❌ Error getOrder:', error.message);
    return null;
  }
}

async function getOrdersByUser(userId, status = null) {
  try {
    const filter = { userId };
    if (status) filter.status = status;
    return await Order.find(filter).sort({ createdAt: -1 });
  } catch (error) {
    console.error('❌ Error getOrdersByUser:', error.message);
    return [];
  }
}

async function getOrdersByStatus(status) {
  try {
    return await Order.find({ status }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('❌ Error getOrdersByStatus:', error.message);
    return [];
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    const updateData = { status };
    if (status === 'confirmed') updateData.confirmedAt = new Date();
    if (status === 'rejected') updateData.rejectedAt = new Date();
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    );
    return order;
  } catch (error) {
    console.error('❌ Error updateOrderStatus:', error.message);
    return null;
  }
}

async function getPendingOrders() {
  return await getOrdersByStatus('pending');
}

// ============================================================
// EXPORT SEMUA FUNGSI DAN MODEL
// ============================================================
module.exports = {
  // Koneksi
  connect,
  disconnect,
  isDbConnected,
  
  // Model
  User,
  Product,
  Order,
  
  // Fungsi User
  findOrCreateUser,
  getUser,
  updateUser,
  
  // Fungsi Poin
  getPoin,
  addPoin,
  subtractPoin,
  hasEnoughPoin,
  
  // Fungsi Product
  createProduct,
  getProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  
  // Fungsi Order
  createOrder,
  getOrder,
  getOrdersByUser,
  getOrdersByStatus,
  updateOrderStatus,
  getPendingOrders
};