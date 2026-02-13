const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require('path');

const app = express();
const PORT = 4000;

// Connect to MongoDB
connectDB();

// Middlewares - ORDER MATTERS!
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb', parameterLimit: 50000 }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============= MONGODB MODELS =============
const Student = require('./models/Student');
const Content = require('./models/Content');
const Quiz = require('./models/Quiz');
const QuizAttempt = require('./models/QuizAttempt');

// ============= IN-MEMORY STORAGE (BACKWARD COMPATIBILITY) =============
// This is only for existing users, all new users go to MongoDB
let users = [];

// Load existing users from MongoDB on startup
async function loadUsersFromMongoDB() {
  try {
    const students = await Student.find({});
    users = students.map(s => ({
      id: s._id.toString(),
      username: s.username,
      pin: s.pin,
      securityQuestions: s.securityQuestions,
      createdAt: s.createdAt,
      role: 'student',
      mongodbId: s._id,
      grade: s.grade
    }));
    console.log(`📚 Loaded ${users.length} existing users from MongoDB`);
  } catch (error) {
    console.error('❌ Error loading users from MongoDB:', error);
  }
}
loadUsersFromMongoDB();

// ============= ROUTES =============

// TEST ROUTE - Check if server is running
app.get("/", (req, res) => {
  res.send("Backend is running on port 4000 ✅");
});

// ✅ REGISTER ROUTE - SAVES TO MONGODB PERMANENTLY
app.post("/register", async (req, res) => {
  console.log("\n" + "=".repeat(60));
  console.log("📝 REGISTER ENDPOINT HIT!");
  console.log("Request body:", req.body);
  console.log("=".repeat(60));
  
  const { username, pin, securityQuestions, grade } = req.body;
  
  // Validation
  if (!username || !pin || !securityQuestions) {
    console.log("❌ Missing fields");
    return res.status(400).json({ 
      message: "All fields are required" 
    });
  }
  
  if (pin.length !== 4 || !/^\d+$/.test(pin)) {
    console.log("❌ Invalid PIN format:", pin);
    return res.status(400).json({ 
      message: "PIN must be exactly 4 digits" 
    });
  }
  
  try {
    // ✅ CHECK MONGODB FOR EXISTING USER
    const existingUser = await Student.findOne({ username });
    
    if (existingUser) {
      console.log("❌ Username already exists in MongoDB:", username);
      return res.status(400).json({ 
        message: "Username already exists" 
      });
    }
    
    // Normalize security questions
    const normalizedSecurityQuestions = {
      motherName: (securityQuestions.motherName || "").trim().toLowerCase(),
      childhoodName: (securityQuestions.childhoodName || "").trim().toLowerCase(),
      cousinName: (securityQuestions.cousinName || "").trim().toLowerCase(),
    };

    // ✅ SAVE TO MONGODB - THIS IS PERMANENT!
    const newStudent = new Student({
      username,
      pin,
      securityQuestions: normalizedSecurityQuestions,
      grade: grade || 4,
      fullName: '',
      createdAt: new Date(),
      lastLogin: null,
      totalQuizzesTaken: 0,
      averageScore: 0
    });
    
    await newStudent.save();
    console.log("✅✅✅ USER REGISTERED IN MONGODB:", username);
    console.log("📊 MongoDB ID:", newStudent._id);
    
    // ✅ ALSO SAVE TO MEMORY ARRAY FOR BACKWARD COMPATIBILITY
    const memoryUser = {
      id: users.length + 1,
      username,
      pin,
      securityQuestions: normalizedSecurityQuestions,
      createdAt: new Date(),
      role: "student",
      mongodbId: newStudent._id,
      grade: newStudent.grade
    };
    users.push(memoryUser);
    
    res.status(201).json({ 
      message: "Registration successful! Redirecting to login...",
      user: { 
        username: newStudent.username, 
        id: newStudent._id,
        grade: newStudent.grade
      }
    });
    
  } catch (error) {
    console.error("❌ MongoDB Registration Error:", error);
    res.status(500).json({ 
      message: "Registration failed: " + error.message 
    });
  }
});

// ✅ LOGIN ROUTE - CHECKS MONGODB FIRST
app.post("/login", async (req, res) => {
  console.log("\n" + "=".repeat(60));
  console.log("🔐 LOGIN ENDPOINT HIT!");
  console.log("Request body:", req.body);
  console.log("=".repeat(60));
  
  const { username, pin } = req.body;
  
  if (!username || !pin) {
    return res.status(400).json({ 
      message: "Username and PIN are required",
      success: false 
    });
  }
  
  try {
    // ✅ CHECK MONGODB FIRST
    const student = await Student.findOne({ username, pin });
    
    if (student) {
      console.log("✅✅✅ LOGIN SUCCESSFUL FROM MONGODB:", username);
      
      // Update last login
      student.lastLogin = new Date();
      await student.save();
      
      return res.json({ 
        message: "Login successful",
        success: true,
        user: { 
          username: student.username, 
          id: student._id,
          role: "student",
          grade: student.grade,
          fullName: student.fullName
        }
      });
    }
    
    // ❌ FALLBACK: Check in-memory for legacy users
    const memoryUser = users.find(u => u.username === username && u.pin === pin);
    if (memoryUser) {
      console.log("⚠️ Login successful from MEMORY (legacy user):", username);
      return res.json({ 
        message: "Login successful",
        success: true,
        user: { 
          username: memoryUser.username, 
          id: memoryUser.mongodbId || memoryUser.id, 
          role: memoryUser.role,
          grade: memoryUser.grade || 4
        }
      });
    }
    
    console.log("❌ Login failed: Invalid credentials for:", username);
    res.status(401).json({ 
      message: "Invalid username or PIN",
      success: false 
    });
    
  } catch (error) {
    console.error("❌ MongoDB Login Error:", error);
    res.status(500).json({ 
      message: "Login failed", 
      success: false 
    });
  }
});

// ✅ FORGOT PIN - Verify Security Questions (MONGODB)
app.post("/forgot-pin/verify", async (req, res) => {
  console.log("\n" + "=".repeat(60));
  console.log("❓ FORGOT PIN VERIFY ENDPOINT HIT!");
  console.log("Request body:", req.body);
  console.log("=".repeat(60));
  
  const { username, answers } = req.body;
  
  if (!answers || !answers.motherName || !answers.childhoodName || !answers.cousinName) {
    return res.status(400).json({
      message: "All security answers are required",
      verified: false,
    });
  }

  try {
    // ✅ CHECK MONGODB FIRST
    const student = await Student.findOne({ username });
    
    if (!student) {
      // Fallback to memory
      const memoryUser = users.find(u => u.username === username);
      if (!memoryUser) {
        return res.status(404).json({ 
          message: "User not found",
          verified: false 
        });
      }
      
      const isVerified = 
        memoryUser.securityQuestions.motherName === answers.motherName.trim().toLowerCase() &&
        memoryUser.securityQuestions.childhoodName === answers.childhoodName.trim().toLowerCase() &&
        memoryUser.securityQuestions.cousinName === answers.cousinName.trim().toLowerCase();
      
      if (isVerified) {
        console.log("✅ Security verification successful for MEMORY user:", username);
        return res.json({ 
          message: "Verification successful",
          verified: true 
        });
      }
    }
    
    const isVerified = 
      student.securityQuestions.motherName === answers.motherName.trim().toLowerCase() &&
      student.securityQuestions.childhoodName === answers.childhoodName.trim().toLowerCase() &&
      student.securityQuestions.cousinName === answers.cousinName.trim().toLowerCase();
    
    if (isVerified) {
      console.log("✅ Security verification successful for MONGODB user:", username);
      res.json({ 
        message: "Verification successful",
        verified: true 
      });
    } else {
      console.log("❌ Security verification failed for:", username);
      res.status(401).json({ 
        message: "Security answers do not match",
        verified: false 
      });
    }
  } catch (error) {
    console.error("❌ MongoDB Verification Error:", error);
    res.status(500).json({ 
      message: "Verification failed", 
      verified: false 
    });
  }
});

// ✅ FORGOT PIN - Reset PIN (MONGODB)
app.post("/forgot-pin/reset", async (req, res) => {
  console.log("\n" + "=".repeat(60));
  console.log("🔑 RESET PIN ENDPOINT HIT!");
  console.log("Request body:", req.body);
  console.log("=".repeat(60));
  
  const { username, newPin } = req.body;
  
  if (!newPin || newPin.length !== 4 || !/^\d+$/.test(newPin)) {
    return res.status(400).json({ 
      message: "PIN must be exactly 4 digits" 
    });
  }
  
  try {
    // ✅ UPDATE MONGODB
    const student = await Student.findOne({ username });
    
    if (student) {
      student.pin = newPin;
      await student.save();
      console.log("✅ PIN reset successful for MONGODB user:", username);
      return res.json({ 
        message: "PIN reset successful. Please login with your new PIN." 
      });
    }
    
    // Fallback to memory
    const memoryUser = users.find(u => u.username === username);
    if (memoryUser) {
      memoryUser.pin = newPin;
      console.log("✅ PIN reset successful for MEMORY user:", username);
      return res.json({ 
        message: "PIN reset successful. Please login with your new PIN." 
      });
    }
    
    res.status(404).json({ 
      message: "User not found" 
    });
    
  } catch (error) {
    console.error("❌ MongoDB PIN Reset Error:", error);
    res.status(500).json({ 
      message: "PIN reset failed" 
    });
  }
});

// ✅ GET ALL USERS (for testing) - MERGES MONGODB + MEMORY
app.get("/users", async (req, res) => {
  try {
    const mongodbUsers = await Student.find({}).select('-pin -securityQuestions');
    const memoryUsersWithoutPin = users.map(({ pin, ...rest }) => rest);
    
    const allUsers = [...mongodbUsers, ...memoryUsersWithoutPin];
    console.log("📋 Users requested - MongoDB:", mongodbUsers.length, "Memory:", users.length);
    res.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ CLEAR ALL USERS (for testing) - WARNING: DELETES FROM MONGODB!
app.delete("/users", async (req, res) => {
  try {
    await Student.deleteMany({});
    users = [];
    console.log("🗑️ All users cleared from MongoDB and memory");
    res.json({ message: "All users cleared" });
  } catch (error) {
    console.error("Error clearing users:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============= API ROUTES =============

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');

// Use API routes
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

// ============= 404 HANDLER =============
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: "Route not found", 
    method: req.method, 
    path: req.url 
  });
});

// ============= ERROR HANDLER =============
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ============= START SERVER =============
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log(`✅✅✅ SERVER RUNNING ON http://localhost:${PORT}`);
  console.log("=".repeat(60));
  console.log("\n📝 AVAILABLE ENDPOINTS:");
  console.log("   GET  → http://localhost:4000/");
  console.log("   POST → http://localhost:4000/register");
  console.log("   POST → http://localhost:4000/login");
  console.log("   POST → http://localhost:4000/forgot-pin/verify");
  console.log("   POST → http://localhost:4000/forgot-pin/reset");
  console.log("   GET  → http://localhost:4000/users");
  console.log("   DELETE → http://localhost:4000/users");
  
  console.log("\n👑 ADMIN API ENDPOINTS:");
  console.log("   POST → http://localhost:4000/api/admin/login");
  console.log("   GET  → http://localhost:4000/api/admin/stats");
  console.log("   GET  → http://localhost:4000/api/admin/students");
  console.log("   DELETE → http://localhost:4000/api/admin/students/:id");
  console.log("   POST → http://localhost:4000/api/admin/content");
  console.log("   GET  → http://localhost:4000/api/admin/content");
  console.log("   DELETE → http://localhost:4000/api/admin/content/:id");
  console.log("   POST → http://localhost:4000/api/admin/quizzes");
  console.log("   GET  → http://localhost:4000/api/admin/quizzes");
  console.log("   GET  → http://localhost:4000/api/admin/quizzes/:id");
  console.log("   PUT  → http://localhost:4000/api/admin/quizzes/:id");
  console.log("   DELETE → http://localhost:4000/api/admin/quizzes/:id");
  console.log("   GET  → http://localhost:4000/api/admin/quizzes/:id/results");

  console.log("\n🎓 STUDENT API ENDPOINTS:");
  console.log("   POST → http://localhost:4000/api/student/login");
  console.log("   POST → http://localhost:4000/api/student/register");
  console.log("   GET  → http://localhost:4000/api/student/content");
  console.log("   PUT  → http://localhost:4000/api/student/content/:id/view");
  console.log("   PUT  → http://localhost:4000/api/student/content/:id/download");
  console.log("   GET  → http://localhost:4000/api/student/quizzes");
  console.log("   GET  → http://localhost:4000/api/student/quizzes/:id/take");
  console.log("   POST → http://localhost:4000/api/student/quizzes/:id/submit");
  console.log("   POST → http://localhost:4000/api/student/quizzes/:id/auto-submit");
  console.log("   GET  → http://localhost:4000/api/student/:studentId/history");
  console.log("   GET  → http://localhost:4000/api/student/:studentId/dashboard");
  
  console.log("\n" + "=".repeat(60));
  console.log("\n🔥🔥🔥 MONGODB IS ACTIVE - ALL NEW REGISTRATIONS ARE PERMANENT!");
  console.log("📚 Loaded", users.length, "existing users from database");
  console.log("\n" + "=".repeat(60));
});