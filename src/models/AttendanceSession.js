import mongoose from "mongoose";

const AttendanceSessionSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["Open", "Closed"], // Open = Active/Started, Closed = Completed/Locked
      default: "Open",
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.models.AttendanceSession || mongoose.model("AttendanceSession", AttendanceSessionSchema);
