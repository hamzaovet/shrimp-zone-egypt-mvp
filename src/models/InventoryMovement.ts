import mongoose from 'mongoose';

// Bust Next.js cache
delete mongoose.models.InventoryMovement;

const inventoryMovementSchema = new mongoose.Schema({
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  type: { type: String, enum: ['OPENING', 'IN', 'OUT'], required: true },
  quantity: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  reference: { type: String }, // e.g., 'Order #0002', 'Manual Addition', 'Initial Stock'
  date: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.InventoryMovement || mongoose.model('InventoryMovement', inventoryMovementSchema);
