const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

// Register
const registerUser = async (req, res) => {
  const { userName, email, password } = req.body;

  if (!userName || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 12);
    const user = new User({ userName, email, password: hashPassword });
    await user.save();
    res.status(201).json({ success: true, message: "Registration Successful" });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

// Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    const checkUser = await User.findOne({ email });
    if (!checkUser) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, checkUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: checkUser._id,
        email: checkUser.email,
        role: checkUser.role,
        userName: checkUser.userName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000, // 1 hour
      })
      .json({
        success: true,
        message: "Login Successful",
        user: {
          id: checkUser._id,
          userName: checkUser.userName,
          email: checkUser.email,
          role: checkUser.role,
        },
      });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

// Logout
const logoutUser = async (req, res) => {
  res.clearCookie("token").json({ success: true, message: "Logout Successful" });
};

// Auth middleware — verifies JWT
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized — no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Unauthorized — invalid token" });
  }
};

// Role middleware — checks if user has required role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden — insufficient permissions" });
    }
    next();
  };
};

module.exports = { registerUser, loginUser, logoutUser, authMiddleware, requireRole };
