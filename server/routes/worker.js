const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../utils/middleware');
const {
  submitApplication,
  getWorkerProfile,
  updateWorkerProfile,
  getWorkerAppointments
} = require('../controllers/worker');

// Public routes
router.post('/applications', submitApplication);

// Protected worker routes
router.get('/me', protect, authorize('worker'), getWorkerProfile);
router.put('/me', protect, authorize('worker'), updateWorkerProfile);
router.get('/me/appointments', protect, authorize('worker'), getWorkerAppointments);

module.exports = router;