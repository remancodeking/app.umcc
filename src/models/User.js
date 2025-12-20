import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    email: {
      type: String,
      sparse: true,
    },
    mobile: {
      type: String,
      sparse: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
    },
    role: {
      type: String,
      enum: ['Admin', 'Cashier', 'Employee'], // Removed 'User'
      default: 'Employee',
    },
    // User specific
    nationalId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Employee specific
    iqamaNumber: {
      type: String, // Also serves as SA ID Card (10 numbers)
      unique: true,
      required: [true, 'Please provide an Iqama/ID number'], // Made required
    },
    sm: {
      type: String,
      unique: true,
      sparse: true,
    },
    empCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    designation: {
      type: String,
      enum: ['Porter', 'Team Leader', 'Supervisor', 'Ground Operation Manager', 'GID', 'Hotel Incharge', 'Cashier', 'Operation Manager', 'Transport Incharge'],
    },
    passportNumber: {
      type: String,
    },
    shift: {
      type: String,
      enum: ['A', 'B'],
    },
    isOnboarding: { // Added field to track if password change is needed
        type: Boolean,
        default: true
    },
    status: {
      type: String,
      enum: ['In Work', 'Out Work'],
      default: 'In Work'
    },
    terminal: {
      type: String,
      enum: ['Hajj Terminal', 'New Terminal', 'North Terminal'],
    },
    roomGroups: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomGroup', 
    }],
    attendance: [{
      date: Date,
      status: String,
      checkIn: String,
      checkOut: String,
    }],
  },
  { timestamps: true }
);

// Force re-compile model in dev to pick up enum changes without restart
if (process.env.NODE_ENV === 'development') {
  if (mongoose.models.User) {
    delete mongoose.models.User;
  }
}

export default mongoose.models.User || mongoose.model('User', UserSchema);
