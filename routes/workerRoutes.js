const express = require("express");
const router = express.Router();
const WorkerApplication = require("../models/WorkerApplication");
const Worker = require("../models/Worker");
const Service = require("../models/Service");
const { protect, workerOnly } = require("../middleware/auth");

// Submit worker application
router.post("/apply", async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check if application already exists
    const existingApplication = await WorkerApplication.findOne({ email });
    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "An application with this email already exists" });
    }

    // Check if worker already exists
    const existingWorker = await Worker.findOne({ email });
    if (existingWorker) {
      return res
        .status(400)
        .json({ message: "A worker with this email already exists" });
    }

    const application = await WorkerApplication.create({
      name,
      email,
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error submitting application",
      error: error.message,
    });
  }
});

// Complete registration with code
router.post("/register", async (req, res) => {
  try {
    const { email, code, password } = req.body;

    // Find the application
    const application = await WorkerApplication.findOne({
      email,
      status: "accepted",
      registrationCode: code,
    });

    if (!application) {
      return res
        .status(400)
        .json({ message: "Invalid or expired registration code" });
    }

    // Create worker account
    const worker = await Worker.create({
      name: application.name,
      email: application.email,
      password,
    });

    const { email: workerEmail, id, name } = worker;

    // Delete the application
    await application.deleteOne();

    res.status(201).json({
      success: true,
      message: "Registration completed successfully",
      data: { email: workerEmail, id, name },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error completing registration",
      error: error.message,
    });
  }
});

// Get worker's service history
router.get("/service-history", protect, workerOnly, async (req, res) => {
  try {
    const services = await Service.find({
      assignedWorker: req.worker._id,
      status: { $in: ["completed"] },
      // status: { $in: ["completed", "assigned"] },
    })
      .populate("client", "email")
      .sort({ "firstClean.date": -1 });

    const history = services.map((service) => ({
      id: service._id,
      address: service.address,
      bedrooms: service.bedrooms,
      bathrooms: service.bathrooms,
      frequency: service.frequency,
      price: service.price,
      firstClean: service.firstClean,
      status: service.status,
      completedAt: service.completedAt,
      client: service.client,
    }));

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching service history",
      error: error.message,
    });
  }
});

// Get worker's current services
router.get("/current-services", protect, workerOnly, async (req, res) => {
  try {
    const services = await Service.find({
      assignedWorker: req.worker._id,
      status: "assigned",
    })
      .populate("client", "email")
      .sort({ "firstClean.date": 1 });

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching current services",
      error: error.message,
    });
  }
});

module.exports = router;
