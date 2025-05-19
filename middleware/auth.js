const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Worker = require("../models/Worker");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from the token
      if (decoded.role === "admin") {
        req.admin = await Admin.findById(decoded.id).select("-password");
      } else if (decoded.role === "worker") {
        req.worker = await Worker.findById(decoded.id).select("-password");
      }

      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.admin) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

// Worker only middleware
const workerOnly = (req, res, next) => {
  if (req.worker) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as a worker" });
  }
};

module.exports = {
  generateToken,
  protect,
  adminOnly,
  workerOnly,
};
