import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  branch: { type: String, required: true, unique: true },
  // Default to 1970 so the FIRST shift ever captures all history
  lastShiftCloseTimestamp: { type: Date, default: () => new Date(0) },
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
