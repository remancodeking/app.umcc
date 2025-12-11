import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    mobile: {
      type: String,
      required: [true, 'Please provide a mobile number'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
    },
    role: {
      type: String,
      enum: ['Admin', 'Cashier', 'Employee', 'User'],
      default: 'User',
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
      sparse: true,
    },
    sm: {
      type: String,
    },
    empCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    designation: {
      type: String,
      enum: ['Porter', 'Team Leader', 'Supervisor', 'Ground Operation Manager'],
    },
    passportNumber: {
      type: String,
    },
    shift: {
      type: String,
      enum: ['A', 'B'],
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

export default mongoose.models.User || mongoose.model('User', UserSchema);
