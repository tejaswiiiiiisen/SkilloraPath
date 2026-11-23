import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (_) {}

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://tejaswisen27_db_user:ZDsf6upd9UlcLnUV@cluster0.94pjcvt.mongodb.net/skillorapath?retryWrites=true&w=majority';

const INITIAL_CREDENTIALS = [
  {
    id: "cred-001",
    intern_id: "INT-2026-001",
    name: "Manas Suryavanshi",
    email: "manas.survanshi@example.com",
    role: "AI & Machine Learning Intern",
    department: "Engineering",
    college: "BITS Pilani",
    username: "manassuryavanshi_001",
    password: "Skillora@1001",
    status: "Active",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-002",
    intern_id: "AGX-2026-7237",
    name: "Tejaswi sen",
    email: "tejaswisen26@gmail.com",
    role: "MERN Stack Developer Intern",
    department: "Software Development",
    college: "bombay",
    username: "tejaswisen_723",
    password: "Skillora@7237",
    status: "Selected",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-003",
    intern_id: "AGX-2026-3673",
    name: "akshita brother",
    email: "tejaswisen27@gmail.com",
    role: "SOCIAL MEDIA & CONTENT CREATOR",
    department: "Marketing",
    college: "delhi",
    username: "akshitabrother_367",
    password: "Skillora@3673",
    status: "Selected",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-004",
    intern_id: "app-1795422925810",
    name: "Harsh Vardhan",
    email: "harsh.vardhan@example.com",
    role: "MERN Stack Developer Intern",
    department: "Engineering",
    college: "Ajmer, Rajasthan",
    username: "harshvardhan_810",
    password: "Skillora@2810",
    status: "Selected",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-005",
    intern_id: "INT-2026-002",
    name: "Aman Verma",
    email: "aman.verma@example.com",
    role: "Frontend Developer Intern",
    department: "Engineering",
    college: "Govt Engineering College, Ajmer",
    username: "amanverma_002",
    password: "Skillora@002",
    status: "Completed & Certified",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-006",
    intern_id: "INT-2026-003",
    name: "Kavya Patel",
    email: "kavya.patel@example.com",
    role: "UI/UX Design Intern",
    department: "Design",
    college: "Sophia Girls College, Ajmer",
    username: "kavyapatel_003",
    password: "Skillora@003",
    status: "Completed & Certified",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-007",
    intern_id: "INT-2026-004",
    name: "Vikram Rathore",
    email: "vikram.rathore@example.com",
    role: "UI/UX Product Design Intern",
    department: "Design",
    college: "MLV Textile & Engg College",
    username: "vikramrathore_105",
    password: "Skillora@1105",
    status: "Active",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-008",
    intern_id: "INT-2026-005",
    name: "Ananya Sharma",
    email: "ananya.sharma@example.com",
    role: "Frontend Developer Intern",
    department: "Engineering",
    college: "Sophia Girls College, Ajmer",
    username: "ananyasharma_104",
    password: "Skillora@1104",
    status: "Active",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-009",
    intern_id: "cand-101",
    name: "Raju Kumar",
    email: "raju.kumar@example.com",
    role: "Full Stack Developer Intern",
    department: "Engineering",
    college: "Govt Engineering College, Ajmer",
    username: "rajukumar_101",
    password: "Skillora@1101",
    status: "Active",
    created_at: new Date().toISOString()
  },
  {
    id: "cred-010",
    intern_id: "cand-102",
    name: "Shakir Ali",
    email: "shakir.ali@example.com",
    role: "Backend Developer Intern",
    department: "Engineering",
    college: "Rajasthan Technical University",
    username: "shakirali_102",
    password: "Skillora@1102",
    status: "Active",
    created_at: new Date().toISOString()
  }
];

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(MONGODB_URI, { maxPoolSize: 5 });
  await client.connect();
  const db = client.db('skillorapath');
  const collection = db.collection('portal_credentials');

  console.log('Storing credentials in portal_credentials collection...');
  for (const cred of INITIAL_CREDENTIALS) {
    await collection.updateOne(
      { $or: [{ username: cred.username }, { intern_id: cred.intern_id }, { id: cred.id }] },
      { $set: cred },
      { upsert: true }
    );
    console.log(`Saved: ${cred.name} -> Username: ${cred.username} | Password: ${cred.password}`);
  }

  const count = await collection.countDocuments();
  console.log(`\n Total Portal Credentials in MongoDB Atlas 'portal_credentials': ${count}`);
  await client.close();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
