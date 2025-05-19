const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const Worker = require("../models/Worker");
const { generateToken } = require("../middleware/auth");

// Admin login
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for admin email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(admin._id, "admin");

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
});

// Worker login
router.post("/worker/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for worker email
    const worker = await Worker.findOne({ email });

    if (!worker) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if worker is active
    if (!worker.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    // Check password
    const isMatch = await worker.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(worker._id, "worker");

    res.json({
      success: true,
      data: {
        token,
        worker: {
          id: worker._id,
          name: worker.name,
          email: worker.email,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
});

module.exports = router;
