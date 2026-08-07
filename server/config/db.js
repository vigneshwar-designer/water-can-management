const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('\n======================================================');
    console.log('⚠️  No MONGODB_URI found in .env config.');
    console.log('📂  ACTIVATING DUAL-MODE FALLBACK: LOCAL JSON DATABASE.');
    console.log('======================================================\n');
    process.env.USE_JSON_DB = 'true';
    return;
  }

  try {
    // Connect with a fast timeout (3000ms) so that if MongoDB isn't running, it falls back instantly
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    process.env.USE_JSON_DB = 'false';
    console.log('\n======================================================');
    console.log('🔌  SUCCESS: Connected to MongoDB Database.');
    console.log('======================================================\n');
  } catch (err) {
    console.log('\n======================================================');
    console.log(`⚠️  MongoDB Connection Error: ${err.message}`);
    console.log('📂  FALLING BACK: LOCAL JSON DATABASE.');
    console.log('======================================================\n');
    process.env.USE_JSON_DB = 'true';
  }
}

module.exports = connectDB;
