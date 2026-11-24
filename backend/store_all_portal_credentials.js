import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/skillorapath';
const ATLAS_URI = 'mongodb+srv://tejaswisen27_db_user:ZDsf6upd9UlcLnUV@cluster0.94pjcvt.mongodb.net/skillorapath?retryWrites=true&w=majority';

// Comprehensive Portal Credentials List
const ALL_PORTAL_CREDENTIALS = [
  {
    id: "cred-001",
    intern_id: "INT-2026-001",
    candidate_id: "cand-103",
    name: "Manas Suryavanshi",
    email: "manas.survanshi@example.com",
    role: "AI & Machine Learning Intern",
    department: "Engineering",
    college: "BITS Pilani",
    username: "manassuryavanshi_001",
    password: "Skillora@1001",
    status: "Active",
    role_type: "Intern",
    portal_url: "https://skillorapath.com/portal/login",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-002",
    intern_id: "AGX-2026-7237",
    candidate_id: "app-207",
    name: "Tejaswi Sen",
    email: "tejaswisen26@gmail.com",
    role: "MERN Stack Developer Intern",
    department: "Software Development",
    college: "Bombay",
    username: "tejaswisen_723",
    password: "Skillora@7237",
    status: "Selected",
    role_type: "Intern",
    portal_url: "https://skillorapath.com/portal/login",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-003",
    intern_id: "AGX-2026-3673",
    candidate_id: "app-209",
    name: "Akshita Brother",
    email: "tejaswisen27@gmail.com",
    role: "Social Media & Content Creator",
    department: "Marketing",
    college: "Delhi",
    username: "akshitabrother_367",
    password: "Skillora@3673",
    status: "Selected",
    role_type: "Intern",
    portal_url: "https://skillorapath.com/portal/login",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-004",
    intern_id: "app-1795422925810",
    candidate_id: "app-208",
    name: "Harsh Vardhan",
    email: "harsh.vardhan@example.com",
    role: "MERN Stack Developer Intern",
    department: "Engineering",
    college: "Ajmer, Rajasthan",
    username: "harshvardhan_810",
    password: "Skillora@2810",
    status: "Selected",
    role_type: "Intern",
    portal_url: "https://skillorapath.com/portal/login",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-005",
    intern_id: "INT-2026-002",
    candidate_id: "cand-105",
    name: "Aman Verma",
    email: "aman.verma@example.com",
    role: "Frontend Developer Intern",
    department: "Engineering",
    college: "Govt Engineering College, Ajmer",
    username: "amanverma_002",
    password: "Skillora@002",
    status: "Completed & Certified",
    role_type: "Alumni / Certified",
    portal_url: "https://skillorapath.com/portal/login",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-006",
    intern_id: "INT-2026-003",
    candidate_id: "cand-106",
    name: "Kavya Patel",
    email: "kavya.patel@example.com",
    role: "UI/UX Design Intern",
    department: "Design",
    college: "Sophia Girls College, Ajmer",
    username: "kavyapatel_003",
    password: "Skillora@003",
    status: "Completed & Certified",
    role_type: "Alumni / Certified",
    portal_url: "https://skillorapath.com/portal/login",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-007",
    intern_id: "INT-2026-004",
    candidate_id: "cand-107",
    name: "Vikram Rathore",
    email: "vikram.rathore@example.com",
    role: "UI/UX Product Design Intern",
    department: "Design",
    college: "MLV Textile & Engg College",
    username: "vikramrathore_105",
    password: "Skillora@1105",
    status: "Active",
    role_type: "Intern",
    portal_url: "https://skillorapath.com/portal/login",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-008",
    intern_id: "INT-2026-005",
    candidate_id: "app-204",
    name: "Ananya Sharma",
    email: "ananya.sharma@example.com",
    role: "Frontend Developer Intern",
    department: "Engineering",
    college: "Sophia Girls College, Ajmer",
    username: "ananyasharma_104",
    password: "Skillora@1104",
    status: "Active",
    role_type: "Intern",
    portal_url: "https://skillorapath.com/portal/login",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-009",
    intern_id: "cand-101",
    candidate_id: "app-201",
    name: "Raju Kumar",
    email: "raju.kumar@example.com",
    role: "Full Stack Developer Intern",
    department: "Engineering",
    college: "Govt Engineering College, Ajmer",
    username: "rajukumar_101",
    password: "Skillora@1101",
    status: "Active",
    role_type: "Intern",
    portal_url: "https://skillorapath.com/portal/login",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-010",
    intern_id: "cand-102",
    candidate_id: "app-202",
    name: "Shakir Ali",
    email: "shakir.ali@example.com",
    role: "Backend Developer Intern",
    department: "Engineering",
    college: "Rajasthan Technical University",
    username: "shakirali_102",
    password: "Skillora@1102",
    status: "Active",
    role_type: "Intern",
    portal_url: "https://skillorapath.com/portal/login",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-admin-001",
    intern_id: "ADM-2026-001",
    candidate_id: "admin-root",
    name: "Admin Executive",
    email: "admin@skillorapath.com",
    role: "Super Admin & Portal Director",
    department: "Executive Management",
    college: "Executive Head Office",
    username: "admin@skillorapath.com",
    password: "SkilloraAdmin@2026",
    status: "Active",
    role_type: "Super Admin",
    portal_url: "https://skillorapath.com/admin/login",
    created_at: new Date().toISOString()
  }
];

async function storeInDb(uri, label) {
  console.log(`\n========================================`);
  console.log(`Connecting to ${label}...`);
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    console.log(`✅ Connected to ${label}!`);
    const db = client.db('skillorapath');

    const collections = ['credentials', 'portal_credentials'];

    for (const colName of collections) {
      const collection = db.collection(colName);

      // Create index on username and intern_id
      try {
        await collection.createIndex({ username: 1 }, { unique: true, sparse: true });
        await collection.createIndex({ intern_id: 1 }, { sparse: true });
      } catch (_) {}

      console.log(`--> Upserting ${ALL_PORTAL_CREDENTIALS.length} credentials into '${colName}'...`);
      for (const cred of ALL_PORTAL_CREDENTIALS) {
        await collection.updateOne(
          { $or: [{ username: cred.username }, { intern_id: cred.intern_id }, { id: cred.id }] },
          { $set: { ...cred, updated_at: new Date().toISOString() } },
          { upsert: true }
        );
      }

      const total = await collection.countDocuments();
      console.log(`✅ Collection '${colName}' total documents: ${total}`);
    }

    // Print summary from 'credentials'
    const credCol = db.collection('credentials');
    const allDocs = await credCol.find({}).project({ _id: 0, intern_id: 1, name: 1, username: 1, password: 1, role: 1, status: 1 }).toArray();
    console.log('\n--- STORED CREDENTIALS IN MONGODB ---');
    console.table(allDocs);

    await client.close();
    return true;
  } catch (err) {
    console.warn(`❌ Could not write to ${label}:`, err.message);
    return false;
  }
}

async function run() {
  console.log('🚀 Starting MongoDB Portal Credentials Storage...');

  // 1. Store in Local MongoDB
  const localSuccess = await storeInDb(LOCAL_URI, 'Local MongoDB (mongodb://127.0.0.1:27017/skillorapath)');

  // 2. Also try Atlas if reachable
  await storeInDb(ATLAS_URI, 'MongoDB Atlas Cloud');

  // 3. Keep local JSON backups in sync
  const backupPaths = [
    path.resolve('D:/skillora/backend/data/portal_credentials.json'),
    path.resolve('D:/skillora/dashborad/public/data/portal_credentials.json'),
    path.resolve('D:/dashborad/public/data/portal_credentials.json')
  ];

  const jsonContent = JSON.stringify(ALL_PORTAL_CREDENTIALS, null, 2);
  for (const bp of backupPaths) {
    try {
      fs.mkdirSync(path.dirname(bp), { recursive: true });
      fs.writeFileSync(bp, jsonContent, 'utf-8');
      console.log(`💾 Mirrored to ${bp}`);
    } catch (_) {}
  }

  console.log('\n🎉 ALL PORTAL CREDENTIALS SUCCESSFULLY STORED IN MONGODB!');
}

run();
