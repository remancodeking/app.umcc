import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    clockIn: {
      type: Date,
    },
    clockOut: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Half Day", "On Duty"],
      default: "On Duty",
    },
    shift: {
      type: String,
      default: "A",
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: "Main Terminal",
    },
    notes: {
      type: String,
    }
  },
  { timestamps: true }
);

// Prevent multiple records for same user on same day (unless modeled differently)
// AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
