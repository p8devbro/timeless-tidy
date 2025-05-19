const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const Worker = require("../models/Worker");
const WorkerApplication = require("../models/WorkerApplication");
const {
  sendRegistrationCode,
  sendWorkerSelectionNotification,
} = require("../utils/emailService");
const { protect, adminOnly } = require("../middleware/auth");
const crypto = require("crypto");

// Protect all admin routes
router.use(protect);
router.use(adminOnly);

// Get all workers' applications
router.get("/workers/applications", async (req, res) => {
  try {
    const applications = await WorkerApplication.find()
      .select(["name", "email", "_id"])
      .sort({ createdAt: -1 });

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

// Review application (accept/reject)
router.post("/workers/applications/:id/review", async (req, res) => {
  try {
    const { status } = req.body;
    const application = await WorkerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Application has already been reviewed" });
    }

    if (status === "accepted") {
      // Generate registration code
      const registrationCode = crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase();

      // Update application
      application.status = "accepted";
      application.registrationCode = registrationCode;
      application.reviewedBy = req.admin._id; // Assuming admin is authenticated
      application.reviewedAt = new Date();
      await application.save();

      // Send registration code via email
      await sendRegistrationCode(
        application.email,
        application.name,
        registrationCode
      );
    } else if (status === "rejected") {
      application.status = "rejected";
      application.reviewedBy = req.admin._id;
      application.reviewedAt = new Date();
      await application.save();
    } else {
      return res.status(400).json({ message: "Invalid status" });
    }

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error reviewing application",
      error: error.message,
    });
  }
});

// Get all services' applications
router.get("/services/applications", async (req, res) => {
  try {
    const applications = await Service.find()
      .populate("client", "email")
      .populate("applications.worker", "name email")
      .sort({ createdAt: -1 });

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

// Review worker application for a service
router.post(
  "/services/:serviceId/applications/:workerId/review",
  async (req, res) => {
    try {
      const { status } = req.body;
      const service = await Service.findById(req.params.serviceId);
      const worker = await Worker.findById(req.params.workerId);

      if (!service || !worker) {
        return res.status(404).json({ message: "Service or worker not found" });
      }

      const application = service.applications.find(
        (app) => app.worker.toString() === req.params.workerId
      );

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (application.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Application has already been reviewed" });
      }

      application.status = status;
      application.reviewedBy = req.admin._id;
      application.reviewedAt = new Date();

      if (status === "accepted") {
        // Update service status and assigned worker
        service.status = "assigned";
        service.assignedWorker = worker._id;

        // Send notification email to worker
        await sendWorkerSelectionNotification(worker.email, worker.name, {
          address: service.address,
          firstClean: service.firstClean,
          bedrooms: service.bedrooms,
          bathrooms: service.bathrooms,
          frequency: service.frequency,
          price: service.price,
        });
      }

      await service.save();

      res.json({
        success: true,
        message: `Application ${status} successfully`,
        data: service,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error reviewing application",
        error: error.message,
      });
    }
  }
);

// Mark service as completed
router.post("/services/:serviceId/complete", async (req, res) => {
  try {
    const service = await Service.findById(req.params.serviceId);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.status !== "assigned") {
      return res
        .status(400)
        .json({ message: "Service is not assigned to a worker" });
    }

    service.status = "completed";
    service.completedAt = new Date();
    await service.save();

    res.json({
      success: true,
      message: "Service marked as completed",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error completing service",
      error: error.message,
    });
  }
});

module.exports = router;
