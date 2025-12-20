const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function fixAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('No MONGODB_URI found.');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Update the main admin user
    const res = await User.updateOne(
      { mobile: "0541512404" },
      { 
        $set: { 
          iqamaNumber: "1000000000", 
          sm: "SM-1000",
          designation: "Ground Operation Manager",
          role: "Admin"
        } 
      }
    );
    
    console.log('Update Result:', res);
    console.log('Admin user updated with Iqama: 1000000000 and SM: SM-1000');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixAdmin();
