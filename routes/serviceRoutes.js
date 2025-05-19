const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const Client = require("../models/Client");
const { protect, workerOnly } = require("../middleware/auth");
const crypto = require("crypto");
const { sendClientCredentials } = require("../utils/emailService");

// Create a new service (unauthenticated)
router.post("/", async (req, res) => {
  try {
    const {
      email,
      name,
      bedrooms,
      bathrooms,
      extraTasks,
      cleaningProducts,
      frequency,
      firstClean,
      address,
      price,
    } = req.body;

    // Generate a random password for the client
    const generatedPassword = crypto.randomBytes(4).toString("hex");

    // Find or create client
    let client = await Client.findOne({ email });
    if (!client) {
      client = await Client.create({
        email,
        name,
        password: generatedPassword,
      });
    }

    const service = await Service.create({
      client: client._id,
      bedrooms,
      bathrooms,
      extraTasks,
      cleaningProducts,
      frequency,
      firstClean,
      address,
      price,
    });

    // Send credentials to client
    await sendClientCredentials(email, name, generatedPassword);

    res.status(201).json({
      success: true,
      message:
        "Service created successfully. Check your email for login credentials.",
      data: {
        serviceId: service._id,
        clientId: client._id,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating service",
      error: error.message,
    });
  }
});

// Client login
router.post("/client/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for client email
    const client = await Client.findOne({ email });

    if (!client) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if client is active
    if (!client.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    // Check password
    const isMatch = await client.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(client._id, "client");

    res.json({
      success: true,
      data: {
        token,
        client: {
          id: client._id,
          name: client.name,
          email: client.email,
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

// Get client's services (authenticated)
router.get("/my-services", protect, async (req, res) => {
  try {
    const services = await Service.find({ client: req.client._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching services",
      error: error.message,
    });
  }
});

// Search for services (workers)
router.get("/search", protect, workerOnly, async (req, res) => {
  try {
    const {
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      frequency,
      date,
      cleaningProducts,
    } = req.query;

    const query = { status: "open" };

    // Add filters if provided
    if (minBedrooms || maxBedrooms) {
      query.bedrooms = {};
      if (minBedrooms) query.bedrooms.$gte = parseInt(minBedrooms);
      if (maxBedrooms) query.bedrooms.$lte = parseInt(maxBedrooms);
    }

    if (minBathrooms || maxBathrooms) {
      query.bathrooms = {};
      if (minBathrooms) query.bathrooms.$gte = parseInt(minBathrooms);
      if (maxBathrooms) query.bathrooms.$lte = parseInt(maxBathrooms);
    }

    if (frequency) query.frequency = frequency;
    if (cleaningProducts) query.cleaningProducts = cleaningProducts;
    if (date) {
      query["firstClean.date"] = {
        $gte: new Date(date),
      };
    }

    // Exclude services the worker has already applied to
    query["applications.worker"] = { $ne: req.worker._id };

    const services = await Service.find(query)
      .populate("client", "email")
      .sort({ "firstClean.date": 1 });

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching services",
      error: error.message,
    });
  }
});

// Apply for a service (workers)
router.post("/:id/apply", protect, workerOnly, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.status !== "open") {
      return res
        .status(400)
        .json({ message: "Service is no longer open for applications" });
    }

    // Check if worker has already applied
    const hasApplied = service.applications.some(
      (app) => app.worker.toString() === req.worker._id.toString()
    );

    if (hasApplied) {
      return res
        .status(400)
        .json({ message: "You have already applied for this service" });
    }

    // Add worker's application
    service.applications.push({
      worker: req.worker._id,
      status: "pending",
    });

    await service.save();

    res.json({
      success: true,
      message: "Application submitted successfully",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error applying for service",
      error: error.message,
    });
  }
});

// Get worker's applications
router.get("/my-applications", protect, workerOnly, async (req, res) => {
  try {
    const services = await Service.find({
      "applications.worker": req.worker._id,
    })
      .populate("client", "email")
      .sort({ "applications.appliedAt": -1 });

    // Format the response to show application status
    const applications = services.map((service) => {
      const application = service.applications.find(
        (app) => app.worker.toString() === req.worker._id.toString()
      );
      return {
        service: {
          id: service._id,
          bedrooms: service.bedrooms,
          bathrooms: service.bathrooms,
          frequency: service.frequency,
          firstClean: service.firstClean,
          client: service.client,
        },
        status: application.status,
        appliedAt: application.appliedAt,
      };
    });

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching applications",
      error: error.message,
    });
  }
});

module.exports = router;
