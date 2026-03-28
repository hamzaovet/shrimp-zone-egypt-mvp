import mongoose from 'mongoose';
import './Category';


const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  image: { type: String },
  country: { type: String, enum: ['مصر'], default: 'مصر', required: true },
  isAvailable: { type: Boolean, default: true },
  recipe: [{
    ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    quantity: { type: Number, required: true }
  }]
}, { timestamps: true });

export default mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
