import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (_) {}

import { MongoClient } from 'mongodb';
import fs from 'fs';

const ATLAS_URI = 'mongodb+srv://tejaswisen27_db_user:ZDsf6upd9UlcLnUV@cluster0.94pjcvt.mongodb.net/skillorapath?retryWrites=true&w=majority';
const data = JSON.parse(fs.readFileSync('D:/skillora/backend/data/portal_credentials.json', 'utf-8'));

async function push() {
  console.log('Connecting to MongoDB Atlas Cluster0...');
  const client = new MongoClient(ATLAS_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  console.log('✅ Connected to MongoDB Atlas successfully!');
  const db = client.db('skillorapath');

  for (const colName of ['credentials', 'portal_credentials']) {
    const col = db.collection(colName);
    for (const item of data) {
      await col.updateOne(
        { $or: [{ username: item.username }, { intern_id: item.intern_id }, { id: item.id }] },
        { $set: { ...item, updated_at: new Date().toISOString() } },
        { upsert: true }
      );
    }
    const count = await col.countDocuments();
    console.log(`✅ Collection '${colName}' now has ${count} documents in MongoDB Atlas!`);
  }

  await client.close();
  console.log('🎉 Done! Refresh your MongoDB Atlas browser tab now.');
}

push().catch(err => {
  console.error('Error:', err.message);
});
