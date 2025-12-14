import mongoose from "mongoose";

const SalaryReportSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    totalRevenue: { type: Number, required: true },
    totalPresent: { type: Number, required: true },
    perHead: { type: Number, required: true },
    surplus: { type: Number, default: 0 },
    team: { type: String }, // 'A' or 'B'. If null -> Global/Legacy
    
    records: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: { type: String },
        empCode: { type: String },
        status: { type: String }, // Present, Absent, etc.
        shift: { type: String }, // Added shift field
        roomNumber: { type: String }, // Store Room Number for grouping
        baseAmount: { type: Number, default: 0 },
        deductions: [
          {
            reason: { type: String },
            amount: { type: Number },
          }
        ],
        finalAmount: { type: Number, default: 0 }
      }
    ],

    // Track Payments per Room
    roomDisbursements: [
       {
           roomNumber: { type: String },
           isPaid: { type: Boolean, default: false },
           receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Who collected the cash
           receiverName: { type: String },
           receiptId: { type: String },
           paidAt: { type: Date },
           totalAmount: { type: Number }
       }
    ],

    status: { 
      type: String, 
      enum: ["Draft", "Finalized"], 
      default: "Finalized" 
    }
  },
  { timestamps: true }
);

export default mongoose.models.SalaryReport || mongoose.model("SalaryReport", SalaryReportSchema);
