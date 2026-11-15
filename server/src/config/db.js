const mongoose = require('mongoose');

async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) {
    console.warn('MONGO_URI is not configured; starting without MongoDB.');
    return null;
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');
  return mongoose.connection;
}

module.exports = connectDB;
