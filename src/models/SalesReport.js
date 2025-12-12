import mongoose from "mongoose";

const SalesReportSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    shift: { type: String, enum: ["Day", "Night"], required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
    // --- CASH SALES (Left Column) ---
    revenue: {
      groupsDepartureAlfiyah: { type: Number, default: 0 },
      groupsArrivalAlfiyah: { type: Number, default: 0 },
      groupsDepartureRahman: { type: Number, default: 0 },
      groupsArrivalRahman: { type: Number, default: 0 },
      groupsDepartureBugis: { type: Number, default: 0 },
      groupsArrivalBugis: { type: Number, default: 0 },
      groupsArrivalIbrahim: { type: Number, default: 0 },
      groupsDepartureIbrahim: { type: Number, default: 0 },
      groupsDepartureGeneric: { type: Number, default: 0 },
      groupsArrivalGeneric: { type: Number, default: 0 },
      zamzam: { type: Number, default: 0 },
      bZamzam: { type: Number, default: 0 },
      passengerCollection: { type: Number, default: 0 },
      porterCollection: { type: Number, default: 0 },
      trolley: { type: Number, default: 0 },
    },

    // Total Sales Amount (Calculated)

    // Adjustments
    adjustments: {
      crossShiftTrolleyReceipts: { type: Number, default: 0 }, // Adds to Gross
      crossShiftTrolleyPayments: { type: Number, default: 0 }, // Deducts from Gross
      terminalExpenses: { type: Number, default: 0 }, // Deducts from Gross
      fcUnexchangeable: { type: Number, default: 0 }, // Deducts? or just tracks? Usually deducted from Net to find Cash in Hand
    },

    // Calculated Totals
    totalSalesAmount: { type: Number, default: 0 }, // Revenue Sum
    grossSalesAmount: { type: Number, default: 0 }, // Total Sales + Cross Shift Rects
    netSalesAmount: { type: Number, default: 0 }, // Gross - Payments - Expenses - FC

    // Distribution
    distribution: {
      laborPercentage: { type: Number, default: 45 },
      companyPercentage: { type: Number, default: 55 },
      laborAmount: { type: Number, default: 0 },
      companyAmount: { type: Number, default: 0 },
    },

    // Company Settlement (Bottom Left)
    companySettlement: {
      groupsArrDepAlfiyah: { type: Number, default: 0 },
      groupsArrDepBugis: { type: Number, default: 0 },
      groupsArrDepRahman: { type: Number, default: 0 },
      groupsArrDepIbrahim: { type: Number, default: 0 },
    },

    // Calculated fields for bottom left
    totalArrivalDepartureCR: { type: Number, default: 0 },
    totalBankAndCurrency: { type: Number, default: 0 }, // Bank + Currency from right col
    netCashInHand: { type: Number, default: 0 },

    // --- RIGHT COLUMN ---
    
    // Cash Denominations
    cashDenominations: {
      c500: { type: Number, default: 0 },
      c200: { type: Number, default: 0 },
      c100: { type: Number, default: 0 },
      c50: { type: Number, default: 0 },
      c20: { type: Number, default: 0 },
      c10: { type: Number, default: 0 },
      c5: { type: Number, default: 0 },
      c2: { type: Number, default: 0 }, // Added
      c1: { type: Number, default: 0 },
      totalCash: { type: Number, default: 0 },
    },

    // Foreign Currency
    foreignCurrency: {
      kwd: { amount: Number, sar: Number },
      aed: { amount: Number, sar: Number },
      qar: { amount: Number, sar: Number },
      pkr: { amount: Number, sar: Number },
      idr: { amount: Number, sar: Number },
      try: { amount: Number, sar: Number },
      usd: { amount: Number, sar: Number },
      other: { amount: Number, sar: Number },
      totalForeignCashInSar: { type: Number, default: 0 }, // Sum of SAR values
    },

    // Bottom Right Summary
    bankDeposit: { type: Number, default: 0 },
    currencyDeposit: { type: Number, default: 0 },
    
    amountReceived: {
      arrival: { type: Number, default: 0 },
      departure: { type: Number, default: 0 },
      zamzam: { type: Number, default: 0 },
      totalCash: { type: Number, default: 0 },
    },

    // Staff Stats (Footer)
    staffStats: {
      totalEmp: { type: Number, default: 0 },
      empAbsent: { type: Number, default: 0 },
      empOnLeave: { type: Number, default: 0 },
      empPresent: { type: Number, default: 0 },
    },
    
    status: { type: String, default: "Submitted" },
  },
  { timestamps: true }
);

export default mongoose.models.SalesReport || mongoose.model("SalesReport", SalesReportSchema);
