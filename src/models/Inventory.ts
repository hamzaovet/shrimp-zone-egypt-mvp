import mongoose from 'mongoose';


const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  unit: { type: String, required: true }, // grams, pieces, liters, etc.
  stock: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 0 },
  costPerUnit: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
