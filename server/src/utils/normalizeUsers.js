import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hideme';

async function normalize() {
  const conn = await mongoose.connect(uri);
  const db = conn.connection.db;
  const users = await db.collection('users').find({}).toArray();

  for (const u of users) {
    const ops = u.operationsCount || 0;
    const allowed = ops >= 15 ? ['shield_reticle','phantom_matrix','recon_hud','cipher_ring','apex_enforcer']
      : ops >= 9 ? ['shield_reticle','phantom_matrix','recon_hud','cipher_ring']
      : ops >= 5 ? ['shield_reticle','phantom_matrix','recon_hud']
      : ops >= 2 ? ['shield_reticle','phantom_matrix']
      : ['shield_reticle'];

    const safeFrame = allowed.includes(u.frameStyle) ? u.frameStyle : 'shield_reticle';
    await db.collection('users').updateOne(
      { _id: u._id },
      {
        $set: {
          operationsCount: ops,
          xp: u.xp || 0,
          frameStyle: safeFrame
        }
      }
    );
    console.log(`[Normalized] ${u.username} -> ops: ${ops}, frame: ${safeFrame}`);
  }

  await mongoose.disconnect();
  console.log('Database normalization complete.');
}

normalize().catch(console.error);
