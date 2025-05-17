const Worker = require('../models/Worker');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../services/email');

// @desc    Submit worker application
// @route   POST /api/worker/applications
// @access  Public
exports.submitApplication = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, address, skills, experience, availability } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('Email already in use', 400));
    }

    // Create user with 'pending' status
    const user = await User.create({
      email,
      password,
      role: 'worker',
      isActive: false // Worker needs admin approval
    });

    // Create worker profile
    const worker = await Worker.create({
      user: user._id,
      firstName,
      lastName,
      phone,
      address,
      skills,
      experience,
      availability,
      status: 'pending'
    });

    // Send confirmation email
    const message = `
      <h1>Thank you for your application!</h1>
      <p>Your worker application with Timeless Tidy has been received.</p>
      <p>We will review your application and get back to you soon.</p>
      <p>You'll receive an email with your login credentials once your application is approved.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Your Timeless Tidy Application Received',
      message
    });

    res.status(201).json({
      success: true,
      data: { user, worker }
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Get current worker profile
// @route   GET /api/worker/me
// @access  Private (Worker)
exports.getWorkerProfile = async (req, res, next) => {
  try {
    const worker = await Worker.findOne({ user: req.user.id })
      .populate('user', 'email role isActive');

    if (!worker) {
      return next(new ErrorResponse('Worker profile not found', 404));
    }

    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update worker profile
// @route   PUT /api/worker/me
// @access  Private (Worker)
exports.updateWorkerProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, address, skills, experience, availability } = req.body;

    let worker = await Worker.findOne({ user: req.user.id });

    if (!worker) {
      return next(new ErrorResponse('Worker profile not found', 404));
    }

    // Update worker profile
    worker = await Worker.findByIdAndUpdate(
      worker._id,
      { firstName, lastName, phone, address, skills, experience, availability },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get worker appointments
// @route   GET /api/worker/me/appointments
// @access  Private (Worker)
exports.getWorkerAppointments = async (req, res, next) => {
  try {
    // In a full implementation, this would query the Appointments model
    // For now, we'll return sample data
    const appointments = [
      {
        id: '1',
        clientName: 'John Doe',
        service: 'Standard Cleaning',
        date: '2023-08-15',
        time: '09:00 - 12:00',
        address: '123 Main St, London',
        status: 'confirmed'
      },
      {
        id: '2',
        clientName: 'Jane Smith',
        service: 'Deep Cleaning',
        date: '2023-08-16',
        time: '13:00 - 16:00',
        address: '456 Oak Ave, London',
        status: 'confirmed'
      }
    ];

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (err) {
    next(err);
  }
};