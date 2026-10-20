const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Holding quantity cannot be negative']
    },
    averageBuyPrice: {
      type: Number,
      required: true,
      min: [0, 'Average purchase price cannot be negative']
    },
    totalInvested: {
      type: Number,
      required: true,
      min: [0, 'Total invested amount cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

// Ensure a user has at most one record per stock symbol
holdingSchema.index({ user: 1, symbol: 1 }, { unique: true });

const Holding = mongoose.model('Holding', holdingSchema);
module.exports = Holding;
