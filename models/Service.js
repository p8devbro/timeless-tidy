const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: false,
    },
    address: {
      street: {
        type: String,
        required: false,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      zipCode: {
        type: String,
        required: true,
        trim: true,
      },
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    extraTasks: [
      {
        type: String,
        enum: [
          "ironing",
          "laundry",
          "inside_oven",
          "inside_windows",
          "inside_fridge",
        ],
      },
    ],
    cleaningProducts: {
      type: String,
      enum: ["client_provides", "worker_brings"],
      required: true,
    },
    frequency: {
      type: String,
      enum: ["more_than_weekly", "weekly", "biweekly", "one_off"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    firstClean: {
      date: {
        type: Date,
        required: true,
      },
      time: {
        type: String,
        required: true,
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Please enter a valid time in 24-hour format (HH:MM)",
        ],
      },
    },
    status: {
      type: String,
      enum: ["open", "assigned", "completed", "cancelled"],
      default: "open",
    },
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
    },
    applications: [
      {
        worker: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Worker",
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },
        reviewedAt: {
          type: Date,
        },
      },
    ],
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching open services
serviceSchema.index({ status: 1, "firstClean.date": 1 });
serviceSchema.index({ assignedWorker: 1, status: 1 });

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
