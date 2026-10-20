const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    executionPrice: {
      type: Number,
      required: true,
      min: [0, 'Execution price cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total trade amount cannot be negative']
    },
    realizedProfitLoss: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying user trade history by date
tradeSchema.index({ user: 1, timestamp: -1 });

const Trade = mongoose.model('Trade', tradeSchema);
module.exports = Trade;
