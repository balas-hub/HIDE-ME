import mongoose from 'mongoose';

let gridFsBucket = null;

export async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hideme');
    console.log(`Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);

    // Initialize GridFS bucket for binary file storage
    gridFsBucket = new mongoose.mongo.GridFSBucket(conn.connection.db, {
      bucketName: 'hideme_files'
    });
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
}

export function getGridFsBucket() {
  if (!gridFsBucket && mongoose.connection.readyState === 1) {
    gridFsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'hideme_files'
    });
  }
  return gridFsBucket;
}
