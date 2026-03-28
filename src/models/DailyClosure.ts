import mongoose from 'mongoose';

// Cache-busting logic
if (mongoose.models.DailyClosure) {
  delete mongoose.models.DailyClosure;
}

const dailyClosureSchema = new mongoose.Schema({
  branch: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  openingBalance: { type: Number, required: true, default: 0 },
  cashSales: { type: Number, required: true, default: 0 },
  visaSales: { type: Number, required: true, default: 0 },
  totalExpenses: { type: Number, required: true, default: 0 },
  expectedClosingBalance: { type: Number, required: true, default: 0 },
  actualClosingBalance: { type: Number, required: true, default: 0 },
  variance: { type: Number, required: true, default: 0 },
  isClosed: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure one closure per day per branch
dailyClosureSchema.index({ branch: 1, date: 1 }, { unique: true });

const DailyClosure = mongoose.model('DailyClosure', dailyClosureSchema);
export default DailyClosure;
