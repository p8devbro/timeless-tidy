const mongoose = require('mongoose');
const ClientSchema = new mongoose.Schema({
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
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    cleaningPreferences: {
        type: String,
        required: [true, 'Please add a cleaning price']
    },
    specialInstructions: {
        type: String,
        }
    },
    {
        timestamps: true
    });

    module.exports = mongoose.model('Client', ClientSchema);

    