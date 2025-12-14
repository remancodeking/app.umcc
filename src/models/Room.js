import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please provide a room number'],
      trim: true,
    },
    shift: {
      type: String, // 'A', 'B', etc. 
      required: false, // Optional for backward compatibility, but we will use it
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    capacity: {
      type: Number,
      default: 4,
    },
    status: {
      type: String,
      enum: ['Available', 'Full', 'Maintenance'],
      default: 'Available',
    }
  },
  { timestamps: true }
);

// Compound Index: Enforce Uniqueness of (RoomNumber + Shift)
// This allows "Room 101" (Shift A) and "Room 101" (Shift B) to coexist.
// But prevents "Room 101" (Shift A) from existing twice.
RoomSchema.index({ roomNumber: 1, shift: 1 }, { unique: true });

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
