import mongoose from 'mongoose';

// Cache-busting logic
if (mongoose.models.Expense) {
  delete mongoose.models.Expense;
}

const expenseSchema = new mongoose.Schema({
  branch: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['مرتبات', 'فواتير', 'مشتريات', 'مسحوبات', 'مصاريف عامة'], 
    required: true 
  },
  description: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
