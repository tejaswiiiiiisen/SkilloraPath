import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getApplicationsCollection, getRecordsCollection, getPortalCredentialsCollection, connectMongoDB } from '../config/mongodb.js';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'applications.json');
const DASHBOARD_DATA_FILE = path.resolve('D:/dashborad/public/data/applications.json');
const AGNIX_DATA_FILE = path.resolve('D:/agnix/public/data/applications.json');

let inMemoryApplications = [];

// Initialize and sync applications on startup
async function initApplications() {
  // 1. Try loading from MongoDB Atlas
  try {
    const col = await getApplicationsCollection();
    if (col) {
      const docs = await col.find({}).sort({ created_at: -1 }).toArray();
      if (docs && docs.length > 0) {
        // Remove MongoDB internal _id or map it cleanly
        inMemoryApplications = docs.map(({ _id, ...rest }) => rest);
        console.log(`[Recruitment] Synced ${inMemoryApplications.length} applications from MongoDB Atlas.`);
        persistApplications();
        return;
      }
    }
  } catch (err) {
    console.warn('[Recruitment] Could not load from MongoDB Atlas on start:', err.message);
  }

  // 2. Fallback to local applications.json
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryApplications = parsed;
        console.log(`[Recruitment] Loaded ${inMemoryApplications.length} saved applications from disk.`);
        
        // Push local apps to MongoDB if collection was empty
        try {
          const col = await getApplicationsCollection();
          if (col && inMemoryApplications.length > 0) {
            for (const app of inMemoryApplications) {
              await col.updateOne({ id: app.id }, { $set: app }, { upsert: true });
            }
            console.log('[Recruitment] Migrated existing applications to MongoDB Atlas.');
          }
        } catch (_) {}
      }
    }
  } catch (err) {
    console.warn('[Recruitment] Error loading applications.json:', err.message);
  }
}

// Persist to all dashboard copies
function persistApplications() {
  const jsonStr = JSON.stringify(inMemoryApplications, null, 2);
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, jsonStr, 'utf-8');
  } catch (_) {}

  try {
    fs.mkdirSync(path.dirname(DASHBOARD_DATA_FILE), { recursive: true });
    fs.writeFileSync(DASHBOARD_DATA_FILE, jsonStr, 'utf-8');
  } catch (_) {}

  try {
    fs.mkdirSync(path.dirname(AGNIX_DATA_FILE), { recursive: true });
    fs.writeFileSync(AGNIX_DATA_FILE, jsonStr, 'utf-8');
  } catch (_) {}
}

initApplications();

export async function getJobs(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, count: data?.length || 0, data: data || [] });
  } catch (err) {
    next(err);
  }
}

export async function applyJob(req, res, next) {
  try {
    const body = req.body || {};
    const name = body.candidate_name || body.full_name || body.name || '';
    const email = body.email || '';

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Candidate name and email are required.' });
    }

    const role = body.job_title || body.position || body.title || 'General Application';
    const location = body.location || body.college || 'Remote';
    const experience = body.experience || 'Fresh Graduate';

    const payload = {
      id: body.id || ('app-' + Date.now()),
      candidate_name: name,
      full_name: name,
      name,
      email,
      phone: body.phone || '',
      location,
      college: body.college || location,
      experience,
      position: role,
      job_title: role,
      applied_for: role,
      department: body.department || 'Engineering',
      applied_date: body.applied_date || new Date().toISOString().slice(0, 10),
      linkedin_url: body.linkedin_url || '',
      portfolio_url: body.portfolio_url || '',
      cover_letter: body.cover_letter || '',
      resume_url: body.resume_url || '',
      hr_remarks: body.hr_remarks || 'Applied online through SkilloraPath Careers Registration Portal.',
      status: 'Applied',
      stage: 'Applied',
      created_at: new Date().toISOString()
    };

    // 1. Save directly to MongoDB Atlas
    try {
      const col = await getApplicationsCollection();
      if (col) {
        await col.updateOne(
          { $or: [{ id: payload.id }, { email: payload.email }] },
          { $set: payload },
          { upsert: true }
        );
        console.log(`[MongoDB] Successfully saved application for ${name} (${role}) to MongoDB Atlas!`);
      }
    } catch (mErr) {
      console.warn('[MongoDB] Save warning:', mErr.message);
    }

    // 2. Update memory & local JSON copies for instant fast dashboard access
    inMemoryApplications = inMemoryApplications.filter(
      a => a.id !== payload.id && a.email.toLowerCase() !== payload.email.toLowerCase()
    );
    inMemoryApplications.unshift(payload);
    persistApplications();

    // 3. Fallback to Supabase if configured
    try {
      await supabase.from('applications').insert([payload]);
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: 'Application received and stored in MongoDB Atlas successfully!',
      database: 'MongoDB Atlas',
      data: payload
    });
  } catch (err) {
    next(err);
  }
}

export async function getApplications(req, res, next) {
  try {
    // Return in-memory/disk applications immediately for fast local response
    if (inMemoryApplications && inMemoryApplications.length > 0) {
      return res.json({
        success: true,
        source: 'InMemory',
        count: inMemoryApplications.length,
        data: inMemoryApplications
      });
    }
    // 1. Fetch from MongoDB Atlas
    try {
      const col = await getApplicationsCollection();
      if (col) {
        const docs = await col.find({}).sort({ created_at: -1 }).toArray();
        if (docs && docs.length > 0) {
          const mongoApps = docs.map(({ _id, ...rest }) => rest);
          inMemoryApplications = mongoApps;
          persistApplications();
          return res.json({
            success: true,
            source: 'MongoDB Atlas',
            count: mongoApps.length,
            data: mongoApps
          });
        }
      }
    } catch (mErr) {
      console.warn('[MongoDB] Query fallback:', mErr.message);
    }

    // 2. Return memory/cached applications
    res.json({
      success: true,
      source: 'Local Cache',
      count: inMemoryApplications.length,
      data: inMemoryApplications
    });
  } catch (err) {
    next(err);
  }
}

export async function updateApplicationStatus(req, res, next) {
  try {
    const id = req.params.id;
    const status = req.body?.status || 'Applied';

    // 1. Update in MongoDB Atlas
    try {
      const col = await getApplicationsCollection();
      if (col) {
        await col.updateOne({ id }, { $set: { status, stage: status, updated_at: new Date().toISOString() } });
        console.log(`[MongoDB] Updated application ${id} status to ${status} in MongoDB Atlas.`);
      }
    } catch (mErr) {
      console.warn('[MongoDB] Update status warning:', mErr.message);
    }

    // 2. Update in memory & disk
    inMemoryApplications = inMemoryApplications.map(a => (a.id === id ? { ...a, status, stage: status } : a));
    persistApplications();

    res.json({ success: true, message: 'Application status updated in MongoDB Atlas', id, status });
  } catch (err) {
    next(err);
  }
}

export async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const filename = req.file.filename;
    const localUrl = `http://localhost:5000/uploads/resumes/${filename}`;

    // Mirror to dashboard public folder for direct access
    try {
      const dashFile = path.resolve(`D:/dashborad/public/resumes/${filename}`);
      const agnixFile = path.resolve(`D:/agnix/public/resumes/${filename}`);
      fs.copyFileSync(req.file.path, dashFile);
      fs.copyFileSync(req.file.path, agnixFile);
    } catch (_) {}

    res.json({
      success: true,
      message: 'Resume uploaded successfully to local storage & dashboard mirror',
      filename,
      url: localUrl,
      public_url: `/resumes/${filename}`
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecords(req, res, next) {
  try {
    let records = [];
    try {
      const col = await getRecordsCollection();
      if (col) {
        const docs = await col.find({}).sort({ completed_date: -1, created_at: -1 }).toArray();
        if (docs && docs.length > 0) {
          records = docs.map(({ _id, ...rest }) => rest);
          return res.json({ success: true, source: 'MongoDB Atlas', count: records.length, data: records });
        }
      }
    } catch (mErr) {
      console.warn('[MongoDB Records] Query fallback:', mErr.message);
    }

    // Fallback to local records.json
    try {
      const recFile = path.resolve('D:/dashborad/public/data/records.json');
      if (fs.existsSync(recFile)) {
        records = JSON.parse(fs.readFileSync(recFile, 'utf-8'));
      }
    } catch (_) {}

    res.json({ success: true, source: 'Local Cache', count: records.length, data: records });
  } catch (err) {
    next(err);
  }
}

export async function saveRecord(req, res, next) {
  try {
    const body = req.body || {};
    const id = body.id || `rec-${Date.now()}`;
    const record = {
      ...body,
      id,
      created_at: body.created_at || new Date().toISOString()
    };

    // 1. Save to MongoDB Atlas collection 'records'
    try {
      const col = await getRecordsCollection();
      if (col) {
        await col.updateOne(
          { $or: [{ id: record.id }, { intern_id: record.intern_id }] },
          { $set: record },
          { upsert: true }
        );
        console.log(`[MongoDB Atlas] Successfully saved certified intern record: ${record.name} (${record.intern_id})`);
      }
    } catch (mErr) {
      console.warn('[MongoDB Atlas] Save record warning:', mErr.message);
    }

    // 2. Mirror to dashboard public folder for direct access
    try {
      const dashFile = path.resolve('D:/dashborad/public/data/records.json');
      const agnixFile = path.resolve('D:/agnix/public/data/records.json');
      fs.mkdirSync(path.dirname(dashFile), { recursive: true });
      fs.mkdirSync(path.dirname(agnixFile), { recursive: true });

      let current = [];
      if (fs.existsSync(dashFile)) {
        try { current = JSON.parse(fs.readFileSync(dashFile, 'utf-8')); } catch (_) {}
      }
      current = [record, ...current.filter(r => r.id !== id && r.intern_id !== record.intern_id)];
      const json = JSON.stringify(current, null, 2);
      fs.writeFileSync(dashFile, json, 'utf-8');
      fs.writeFileSync(agnixFile, json, 'utf-8');
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: 'Certified intern record saved to MongoDB Atlas & local database successfully!',
      data: record
    });
  } catch (err) {
    next(err);
  }
}

// PORTAL CREDENTIALS
export async function getPortalCredentials(req, res, next) {
  try {
    let creds = [];
    try {
      const col = await getPortalCredentialsCollection();
      if (col) {
        const docs = await col.find({}).sort({ created_at: -1 }).toArray();
        if (docs && docs.length > 0) {
          creds = docs.map(({ _id, ...rest }) => rest);
          return res.json({ success: true, source: 'MongoDB Atlas', collection: 'portal_credentials', count: creds.length, data: creds });
        }
      }
    } catch (mErr) {
      console.warn('[MongoDB Atlas Credentials] Fallback to disk:', mErr.message);
    }

    const credFile = path.resolve('D:/dashborad/public/data/portal_credentials.json');
    if (fs.existsSync(credFile)) {
      try { creds = JSON.parse(fs.readFileSync(credFile, 'utf-8')); } catch (_) {}
    }

    res.json({ success: true, source: 'Local Cache', collection: 'portal_credentials', count: creds.length, data: creds });
  } catch (err) {
    next(err);
  }
}

export async function savePortalCredential(req, res, next) {
  try {
    const body = req.body || {};
    const username = body.username || body.portal_username;
    const password = body.password || body.portal_password;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const id = body.id || `cred-${Date.now()}`;
    const payload = {
      id,
      name: body.name || body.candidate_name || 'Intern',
      email: body.email || '',
      role: body.role || body.job_title || 'Intern',
      intern_id: body.intern_id || body.candidate_id || id,
      username,
      password,
      status: body.status || 'Active',
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Upsert into MongoDB Atlas 'portal_credentials' collection
    try {
      const col = await getPortalCredentialsCollection();
      if (col) {
        await col.updateOne(
          { $or: [{ username: payload.username }, { intern_id: payload.intern_id }, { id: payload.id }] },
          { $set: payload },
          { upsert: true }
        );
        console.log(`[MongoDB Atlas] Saved Portal Credentials for ${payload.name} (Username: ${payload.username})`);
      }
    } catch (mErr) {
      console.warn('[MongoDB Atlas] Save credential warning:', mErr.message);
    }

    // 2. Mirror to dashboard public folder
    try {
      const dashFile = path.resolve('D:/dashborad/public/data/portal_credentials.json');
      const agnixFile = path.resolve('D:/agnix/public/data/portal_credentials.json');
      fs.mkdirSync(path.dirname(dashFile), { recursive: true });
      fs.mkdirSync(path.dirname(agnixFile), { recursive: true });

      let current = [];
      if (fs.existsSync(dashFile)) {
        try { current = JSON.parse(fs.readFileSync(dashFile, 'utf-8')); } catch (_) {}
      }
      current = [payload, ...current.filter(c => c.username !== username && c.intern_id !== payload.intern_id)];
      const json = JSON.stringify(current, null, 2);
      fs.writeFileSync(dashFile, json, 'utf-8');
      fs.writeFileSync(agnixFile, json, 'utf-8');
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: 'Portal credentials stored in MongoDB Atlas successfully!',
      collection: 'portal_credentials',
      data: payload
    });
  } catch (err) {
    next(err);
  }
}
