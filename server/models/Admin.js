const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: [true, 'Please add a first name']
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name']
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  }
});

module.exports = mongoose.model('Admin', AdminSchema);