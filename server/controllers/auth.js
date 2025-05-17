const User = require('../models/User');
const Client = require('../models/Client');
const Worker = require('../models/Worker');
const Admin = require('../models/Admin');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../services/email');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { email, password, role, firstName, lastName, phone, address, ...additionalData } = req.body;

  try {
    // Create user
    const user = await User.create({
      email,
      password,
      role
    });

    // Create role-specific profile
    let profile;
    const commonData = {
      user: user._id,
      firstName,
      lastName,
      phone,
      address
    };

    switch (role) {
      case 'client':
        profile = await Client.create({
          ...commonData,
          cleaningPreferences: additionalData.cleaningPreferences || '',
          specialInstructions: additionalData.specialInstructions || ''
        });
        break;
      case 'worker':
        profile = await Worker.create({
          ...commonData,
          skills: additionalData.skills || [],
          experience: additionalData.experience || '',
          status: 'pending',
          availability: additionalData.availability || []
        });
        break;
      case 'admin':
        profile = await Admin.create(commonData);
        break;
      default:
        throw new ErrorResponse(`Invalid role: ${role}`, 400);
    }

    // Send welcome email with credentials
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const message = `
      <h1>Welcome to Timeless Tidy!</h1>
      <p>Your account has been successfully created as a ${role}.</p>
      <p>Here are your login credentials:</p>
      <ul>
        <li>Email: ${email}</li>
        <li>Password: ${password}</li>
      </ul>
      <p>You can login here: <a href="${loginUrl}">${loginUrl}</a></p>
      <p>Please change your password after your first login.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your Timeless Tidy Account Credentials',
        message
      });
    } catch (err) {
      console.error('Email could not be sent');
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  try {
    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if worker is approved
    if (user.role === 'worker') {
      const worker = await Worker.findOne({ user: user._id });
      if (worker && worker.status !== 'approved') {
        return next(new ErrorResponse('Your worker application is still under review', 401));
      }
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    let userData;
    
    // Get base user info
    const user = await User.findById(req.user.id);
    
    // Get role-specific info
    switch (user.role) {
      case 'client':
        userData = await Client.findOne({ user: req.user.id });
        break;
      case 'worker':
        userData = await Worker.findOne({ user: req.user.id });
        break;
      case 'admin':
        userData = await Admin.findOne({ user: req.user.id });
        break;
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        profile: userData ? userData.toObject() : null
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      email: req.body.email
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return next(new ErrorResponse('Password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorResponse('There is no user with that email', 404));
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    const message = `
      <h1>You have requested a password reset</h1>
      <p>Please make a PUT request to:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message
      });

      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Invalid token', 400));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      role: user.role
    });
};