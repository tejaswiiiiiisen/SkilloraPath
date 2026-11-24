import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (_) {}

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const uri = 'mongodb+srv://tejaswisen27_db_user:ZDsf6upd9UlcLnUV@cluster0.94pjcvt.mongodb.net/skillorapath?retryWrites=true&w=majority';

async function sync() {
  console.log('Connecting to MongoDB Atlas at:', uri.replace(/:([^:@]+)@/, ':****@'));
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    const db = client.db('skillorapath');
    const appsCol = db.collection('applications');
    
    const appsData = JSON.parse(fs.readFileSync('D:/skillora/backend/data/applications.json', 'utf8'));
    console.log(`Syncing ${appsData.length} applications to MongoDB Atlas...`);
    
    for (const app of appsData) {
      await appsCol.updateOne(
        { id: app.id },
        { $set: { ...app, updated_at: new Date() } },
        { upsert: true }
      );
    }
    
    const count = await appsCol.countDocuments();
    console.log(`✅ Sync Complete! Total applications in MongoDB Atlas: ${count}`);
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    if (err.message.includes('SSL alert number 80') || err.message.includes('tlsv1 alert internal error')) {
      console.log('\n💡 Atlas Firewall Notice: MongoDB Atlas requires adding IP address to Network Access.');
    }
    await client.close().catch(() => {});
    process.exit(1);
  }
}

sync();
