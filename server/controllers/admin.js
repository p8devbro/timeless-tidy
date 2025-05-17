const Worker = require('../models/Worker');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../services/email');

// @desc    Get pending worker applications
// @route   GET /api/admin/workers/pending
// @access  Private (Admin)
exports.getPendingApplications = async (req, res, next) => {
  try {
    const workers = await Worker.find({ status: 'pending' })
      .populate('user', 'email createdAt');

    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve worker application
// @route   PUT /api/admin/workers/:id/approve
// @access  Private (Admin)
exports.approveWorker = async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.params.id).populate('user');

    if (!worker) {
      return next(new ErrorResponse('Worker not found', 404));
    }

    if (worker.status !== 'pending') {
      return next(new ErrorResponse('Worker application already processed', 400));
    }

    // Activate user account
    await User.findByIdAndUpdate(worker.user._id, { isActive: true });

    // Update worker status
    worker.status = 'approved';
    await worker.save();

    // Send approval email with login details
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const message = `
      <h1>Your Application Has Been Approved!</h1>
      <p>Congratulations! Your worker application with Timeless Tidy has been approved.</p>
      <p>Here are your login credentials:</p>
      <ul>
        <li>Email: ${worker.user.email}</li>
        <li>Password: [the password they signed up with]</li>
      </ul>
      <p>You can login to your worker dashboard here: <a href="${loginUrl}">${loginUrl}</a></p>
    `;

    await sendEmail({
      email: worker.user.email,
      subject: 'Your Timeless Tidy Worker Account Approved',
      message
    });

    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject worker application
// @route   PUT /api/admin/workers/:id/reject
// @access  Private (Admin)
exports.rejectWorker = async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.params.id).populate('user');

    if (!worker) {
      return next(new ErrorResponse('Worker not found', 404));
    }

    if (worker.status !== 'pending') {
      return next(new ErrorResponse('Worker application already processed', 400));
    }

    // Update worker status
    worker.status = 'rejected';
    await worker.save();

    // Send rejection email
    const message = `
      <h1>Your Application Status</h1>
      <p>We regret to inform you that your worker application with Timeless Tidy has not been approved at this time.</p>
      <p>Thank you for your interest in our platform.</p>
    `;

    await sendEmail({
      email: worker.user.email,
      subject: 'Your Timeless Tidy Application Status',
      message
    });

    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all workers
// @route   GET /api/admin/workers
// @access  Private (Admin)
exports.getAllWorkers = async (req, res, next) => {
  try {
    const workers = await Worker.find()
      .populate('user', 'email isActive')
      .sort({ status: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get worker details
// @route   GET /api/admin/workers/:id
// @access  Private (Admin)
exports.getWorkerDetails = async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('user', 'email isActive createdAt')
      .populate('appointments', 'date time client service status');

    if (!worker) {
      return next(new ErrorResponse('Worker not found', 404));
    }

    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (err) {
    next(err);
  }
};