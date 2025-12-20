import mongoose from 'mongoose';

const RecoverySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalAmount: {
    type: Number,
    required: [true, 'Please provide total amount']
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason']
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Paused'],
    default: 'Active'
  },
  deductionRate: {
    type: Number,
    default: 100 // Percentage of daily salary to deduct (default 100% per user request)
  },
  history: [{
    amount: Number,
    date: Date,
    salaryReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryReport' }
  }]
}, { timestamps: true });

export default mongoose.models.Recovery || mongoose.model('Recovery', RecoverySchema);
