import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (_) {}

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tejaswisen27_db_user:ZDsf6upd9UlcLnUV@cluster0.94pjcvt.mongodb.net/skillorapath?retryWrites=true&w=majority';

let client = null;
let db = null;
let isConnected = false;

export async function connectMongoDB() {
  if (isConnected && db) return db;

  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000
    });

    await client.connect();
    db = client.db('skillorapath');
    isConnected = true;
    console.log('✅ Successfully connected to MongoDB Atlas (Database: skillorapath)');
    return db;
  } catch (err) {
    console.warn('⚠️ MongoDB Atlas connection warning:', err.message);
    return null;
  }
}

export function getDB() {
  return db;
}

export async function getApplicationsCollection() {
  const database = await connectMongoDB();
  if (database) {
    return database.collection('applications');
  }
  return null;
}

export async function getRecordsCollection() {
  const database = await connectMongoDB();
  if (database) {
    return database.collection('records');
  }
  return null;
}

export async function getPortalCredentialsCollection() {
  const database = await connectMongoDB();
  if (database) {
    return database.collection('portal_credentials');
  }
  return null;
}
