const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/education_system");
    console.log("MongoDB connected ✅");
  } catch (err) {
    console.error("MongoDB Connection Failed ❌", err);
    process.exit(1);
  }
};

module.exports = connectDB;
