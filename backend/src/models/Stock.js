const mongoose = require('mongoose');

const priceHistoryPointSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, required: true },
    price: { type: Number, required: true },
    volume: { type: Number, default: 0 }
  },
  { _id: false }
);

const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    sector: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    exchange: {
      type: String,
      default: 'NSE'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0
    },
    previousClose: {
      type: Number,
      required: true,
      min: 0
    },
    dayHigh: {
      type: Number,
      required: true
    },
    dayLow: {
      type: Number,
      required: true
    },
    fiftyTwoWeekHigh: {
      type: Number
    },
    fiftyTwoWeekLow: {
      type: Number
    },
    volume: {
      type: Number,
      default: 0
    },
    peRatio: {
      type: Number,
      default: 0
    },
    marketCap: {
      type: String,
      default: 'N/A'
    },
    description: {
      type: String,
      default: ''
    },
    history: [priceHistoryPointSchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals for quick financial calculations
stockSchema.virtual('change').get(function () {
  return Number((this.currentPrice - this.previousClose).toFixed(2));
});

stockSchema.virtual('changePercent').get(function () {
  if (!this.previousClose || this.previousClose === 0) return 0;
  return Number((((this.currentPrice - this.previousClose) / this.previousClose) * 100).toFixed(2));
});

const Stock = mongoose.model('Stock', stockSchema);
module.exports = Stock;
