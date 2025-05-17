const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../utils/middleware');
const {
  getPendingApplications,
  approveWorker,
  rejectWorker,
  getAllWorkers,
  getWorkerDetails
} = require('../controllers/admin');

// Admin protected routes
router.get('/workers/pending', protect, authorize('admin'), getPendingApplications);
router.put('/workers/:id/approve', protect, authorize('admin'), approveWorker);
router.put('/workers/:id/reject', protect, authorize('admin'), rejectWorker);
router.get('/workers', protect, authorize('admin'), getAllWorkers);
router.get('/workers/:id', protect, authorize('admin'), getWorkerDetails);

module.exports = router;