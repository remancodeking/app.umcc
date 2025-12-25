const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const User = require('../models/User').default || require('../models/User');

async function fixIndexes() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  try {
    const collection = mongoose.connection.collection('users');
    
    // 1. Drop problematic indexes if they exist
    console.log('Dropping potential problematic indexes...');
    const indexes = await collection.indexes();
    
    for (const idx of indexes) {
        if (idx.name === 'mobile_1' || idx.name === 'email_1' || idx.name === 'empCode_1') {
            await collection.dropIndex(idx.name);
            console.log(`Dropped index: ${idx.name}`);
        }
    }

    // 2. Unset null/empty values in actual documents
    console.log('Cleaning up null/empty values in documents...');
    const resultMobile = await collection.updateMany(
        { $or: [{ mobile: null }, { mobile: '' }] },
        { $unset: { mobile: "" } }
    );
    console.log(`Unset mobile for ${resultMobile.modifiedCount} docs.`);

    const resultEmail = await collection.updateMany(
        { $or: [{ email: null }, { email: '' }] },
        { $unset: { email: "" } }
    );
    console.log(`Unset email for ${resultEmail.modifiedCount} docs.`);

    const resultEmpCode = await collection.updateMany(
        { $or: [{ empCode: null }, { empCode: '' }] },
        { $unset: { empCode: "" } }
    );
    console.log(`Unset empCode for ${resultEmpCode.modifiedCount} docs.`);

    // 3. Re-sync indexes from Mongoose Schema
    console.log('Syncing indexes from Schema...');
    // We need to load the model properly which we required above. 
    // Mongoose automatically builds indexes when model is loaded/connected usually, 
    // but we can force it.
    await User.syncIndexes();
    console.log('Indexes synced. (Sparse should be active)');

  } catch (error) {
    console.error('Error during index fix:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Done.');
  }
}

fixIndexes();
