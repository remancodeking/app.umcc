const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

// Define minimal schema to read users
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function checkUsers() {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('No MONGODB_URI found. Please check .env.local path.');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const users = await User.find({});
    
    console.log('\n--- ALL USERS ---');
    console.table(users.map(u => ({
      _id: u._id.toString(),
      name: u.name,
      mobile: u.mobile,
      iqamaNumber: u.iqamaNumber,
      sm: u.sm,
      role: u.role
    })));
    console.log('-----------------\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();
