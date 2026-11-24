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
const MONGODB_LOCAL_URI = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/skillorapath';

let client = null;
let db = null;
let isConnected = false;
let lastAttempt = 0;

export async function connectMongoDB() {
  if (isConnected && db) return db;
  if (Date.now() - lastAttempt < 10000) return db; // Throttle retries to 10s
  lastAttempt = Date.now();

  // 1. Try MongoDB Atlas Cloud first, then fallback to local MongoDB if offline
  const uris = [MONGODB_URI, MONGODB_LOCAL_URI];

  for (const uri of uris) {
    try {
      const isAtlas = uri.includes('mongodb+srv');
      client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: isAtlas ? 4000 : 2000
      });

      await client.connect();
      db = client.db('skillorapath');
      isConnected = true;
      const target = isAtlas ? 'MongoDB Atlas' : 'Local MongoDB (127.0.0.1:27017)';
      console.log(`✅ Successfully connected to ${target} (Database: skillorapath)`);
      return db;
    } catch (err) {
      const target = uri.includes('mongodb+srv') ? 'Atlas' : 'Local';
      console.warn(`⚠️ [MongoDB ${target}] Connection attempt: ${err.message}`);
    }
  }

  return null;
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

export async function getCredentialsCollection() {
  const database = await connectMongoDB();
  if (database) {
    return database.collection('credentials');
  }
  return null;
}

export async function getInternsCollection() {
  const database = await connectMongoDB();
  return database ? database.collection('interns') : null;
}

export async function getTasksCollection() {
  const database = await connectMongoDB();
  return database ? database.collection('tasks') : null;
}

export async function getAttendanceCollection() {
  const database = await connectMongoDB();
  return database ? database.collection('attendance') : null;
}

export async function getLeavesCollection() {
  const database = await connectMongoDB();
  return database ? database.collection('leaves') : null;
}

export async function getResourcesCollection() {
  const database = await connectMongoDB();
  return database ? database.collection('resources') : null;
}

export async function getAnnouncementsCollection() {
  const database = await connectMongoDB();
  return database ? database.collection('announcements') : null;
}

export async function getMessagesCollection() {
  const database = await connectMongoDB();
  return database ? database.collection('messages') : null;
}

export async function getPerformanceCollection() {
  const database = await connectMongoDB();
  return database ? database.collection('performance') : null;
}
