import mongoose from 'mongoose';


const orderItemSchema = new mongoose.Schema({
  _id: { type: String }, // Store MenuItem ID for inventory deduction
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: Number }, // Human-readable PID for referencing
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  address: { type: String, required: true },
  country: { type: String, default: 'مصر' },
  branch: { type: String, required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discount: {
    type: { type: String }, // '%' or 'fixed'
    value: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  paymentMethod: { type: String, required: true },
  orderType: { type: String, required: true },
  status: { type: String, default: "جديد" }, // Lifecycle: "جديد", "جاري التحضير", "جاهز", "خرج للتوصيل", "تم التسليم"
  preparingAt: { type: Date }, // Time when chef starts cooking
  readyAt: { type: Date }, // Time when food is ready
  deliveredAt: { type: Date }, // Time when handed to customer/driver
  source: { type: String, default: 'Online' },
  isPaid: { type: Boolean, default: false }, // Action 2: Accounting logic
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
