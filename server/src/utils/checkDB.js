import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import StegoRecord from '../models/StegoRecord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hideme';

async function checkDatabase() {
  console.log('====================================================');
  console.log('🍃 Hide Me - Database Connection & Schema Inspector');
  console.log('====================================================\n');
  console.log(`Connecting to: ${uri}...`);

  const startTime = Date.now();
  try {
    const conn = await mongoose.connect(uri);
    const latency = Date.now() - startTime;

    console.log('✅ Connection Status : CONNECTED');
    console.log(`⚡ Host              : ${conn.connection.host}`);
    console.log(`🔌 Port              : ${conn.connection.port}`);
    console.log(`📁 Database Name     : ${conn.connection.name}`);
    console.log(`⏱️ Latency           : ${latency} ms\n`);

    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('----------------------------------------------------');
    console.log(`Active Collections in [${conn.connection.name}]:`);
    console.log('----------------------------------------------------');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  • ${col.name.padEnd(25)} : ${count} document(s)`);
    }

    // Inspect User Schema
    console.log('\n----------------------------------------------------');
    console.log('User Schema:');
    console.log('----------------------------------------------------');
    Object.keys(User.schema.paths).forEach((field) => {
      const pathObj = User.schema.paths[field];
      const req = pathObj.isRequired ? '(REQUIRED)' : '(optional)';
      const unique = pathObj._index?.unique ? '(UNIQUE)' : '';
      console.log(`  - ${field.padEnd(16)} : Type: ${pathObj.instance.padEnd(10)} ${req} ${unique}`);
    });
    console.log(`  Total users: ${await User.countDocuments()}`);

    // Inspect StegoRecord Schema
    console.log('\n----------------------------------------------------');
    console.log('StegoRecord Schema:');
    console.log('----------------------------------------------------');
    Object.keys(StegoRecord.schema.paths).forEach((field) => {
      const pathObj = StegoRecord.schema.paths[field];
      const req = pathObj.isRequired ? '(REQUIRED)' : '(optional)';
      console.log(`  - ${field.padEnd(20)} : Type: ${pathObj.instance.padEnd(10)} ${req}`);
    });
    console.log(`  Total records: ${await StegoRecord.countDocuments()}`);

    // Inspect GridFS Binary Bucket
    console.log('\n----------------------------------------------------');
    console.log('GridFS Files:');
    console.log('----------------------------------------------------');
    const filesCol = db.collection('hideme_files.files');
    const chunksCol = db.collection('hideme_files.chunks');
    const fileCount = await filesCol.countDocuments();
    const chunkCount = await chunksCol.countDocuments();
    console.log(`  • Binary Files Stored : ${fileCount}`);
    console.log(`  • Binary Chunks Stored: ${chunkCount}`);

    console.log('\n====================================================');
    console.log('Database and schemas are healthy and operational.');
    console.log('====================================================\n');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();
