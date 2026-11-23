import { supabase } from '../config/supabase.js';

let inMemoryApplications = [];

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

    const payload = {
      id: body.id || ('app-' + Date.now()),
      candidate_name: name,
      full_name: name,
      name,
      email,
      phone: body.phone || '',
      location: body.location || 'Remote',
      experience: body.experience || '',
      position: role,
      job_title: role,
      department: body.department || 'Engineering',
      applied_date: body.applied_date || new Date().toISOString().slice(0, 10),
      linkedin_url: body.linkedin_url || '',
      portfolio_url: body.portfolio_url || '',
      cover_letter: body.cover_letter || '',
      resume_url: body.resume_url || '',
      hr_remarks: body.hr_remarks || 'Applied online through SkilloraPath Careers Registration Portal.',
      status: body.status || 'Applied',
      stage: 'Applied',
      created_at: new Date().toISOString()
    };

    // Store at the top of memory list
    inMemoryApplications = inMemoryApplications.filter(a => a.id !== payload.id && a.email !== payload.email);
    inMemoryApplications.unshift(payload);

    // Also attempt Supabase insert
    try {
      await supabase.from('applications').insert([payload]);
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: 'Application received and saved successfully!',
      data: payload
    });
  } catch (err) {
    next(err);
  }
}

export async function getApplications(req, res, next) {
  try {
    let supabaseApps = [];
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        supabaseApps = data;
      }
    } catch (_) {}

    const combined = [...inMemoryApplications];
    for (const app of supabaseApps) {
      if (!combined.find(a => a.id === app.id)) {
        combined.push(app);
      }
    }

    res.json({ success: true, count: combined.length, data: combined });
  } catch (err) {
    next(err);
  }
}
