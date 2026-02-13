const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // For now, we'll just log that we're ready to connect
    console.log('📦 MongoDB: Ready to connect (implement later)');
    
    // Uncomment this when you have MongoDB installed:
    await mongoose.connect('mongodb://localhost:27017/education-system');
    console.log('✅ MongoDB Connected successfully');
    
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;