import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please provide a room number'],
      unique: true,
      trim: true,
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

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
