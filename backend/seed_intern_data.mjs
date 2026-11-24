import {
  connectMongoDB,
  getInternsCollection,
  getTasksCollection,
  getAttendanceCollection,
  getLeavesCollection,
  getAnnouncementsCollection,
  getMessagesCollection,
  getPerformanceCollection
} from './src/config/mongodb.js';

async function seed() {
  console.log('🌱 Seeding Intern Portal Collections in MongoDB Atlas...');
  const db = await connectMongoDB();
  if (!db) {
    console.error('Failed to connect to MongoDB');
    process.exit(1);
  }

  // 1. Intern profile
  const internCol = await getInternsCollection();
  const testIntern = {
    id: 'intern-tejaswi-001',
    intern_id: 'INT-2026-723',
    name: 'Tejaswi Sen',
    email: 'tejaswisen26@gmail.com',
    phone: '+91 82099 25051',
    role: 'Full Stack Software Engineering Intern',
    department: 'Engineering & AI Solutions',
    college: 'Govt Engineering College, Ajmer',
    joining_date: '2026-06-01',
    start_date: '2026-06-01',
    end_date: '2026-12-31',
    duration_months: 6,
    working_hours: '10:00 AM - 06:30 PM (Mon - Fri)',
    mentor: 'Shashank Shubham',
    mentor_role: 'Founder & Head of Engineering',
    mentor_email: 'shashank@skillorapath.com',
    stipend: '₹20,000 / month',
    status: 'Active',
    attendance_pct: 96,
    performance_rating: 4.9,
    certificate_status: 'In Progress',
    portal_username: 'tejaswisen_723',
    description: 'Specializing in full stack architecture, distributed backend pipelines, and interactive UI systems.'
  };
  await internCol.updateOne({ email: testIntern.email }, { $set: testIntern }, { upsert: true });
  console.log('✅ Intern Profile seeded');

  // 2. Tasks
  const tasksCol = await getTasksCollection();
  const tasks = [
    {
      id: 'task-101',
      intern_email: 'tejaswisen26@gmail.com',
      title: 'Implement Enterprise MongoDB Atlas Migration & Sync',
      description: 'Migrate local JSON application stores into a robust MongoDB Atlas cluster with auto-sync and resilience failover.',
      priority: 'High',
      status: 'Completed',
      deadline: '2026-11-22',
      assigned_date: '2026-11-18',
      submission: {
        github_url: 'https://github.com/tejaswisen/SkilloraPath/pull/42',
        notes: 'Successfully implemented dual-write to MongoDB Atlas with DNS resilience.'
      },
      mentor_feedback: 'Excellent implementation, fast connection and spotless error handling.',
      is_overdue: false
    },
    {
      id: 'task-102',
      intern_email: 'tejaswisen26@gmail.com',
      title: 'Trainee Portal Responsive UI & Dashboard',
      description: 'Construct the comprehensive Intern Dashboard portal including Attendance, Tasks, Performance, and Certificates view.',
      priority: 'High',
      status: 'In Progress',
      deadline: '2026-11-25',
      assigned_date: '2026-11-21',
      submission: null,
      mentor_feedback: null,
      is_overdue: false
    },
    {
      id: 'task-103',
      intern_email: 'tejaswisen26@gmail.com',
      title: 'REST API Authentication & Role Based Access Control',
      description: 'Secure endpoints under /api/intern and /api/recruitment using session-based and role authorization.',
      priority: 'Medium',
      status: 'Completed',
      deadline: '2026-11-15',
      assigned_date: '2026-11-10',
      submission: {
        github_url: 'https://github.com/tejaswisen/SkilloraPath/commit/auth89',
        notes: 'RBAC implemented for admin vs intern access.'
      },
      mentor_feedback: 'Solid security posture.',
      is_overdue: false
    },
    {
      id: 'task-104',
      intern_email: 'tejaswisen26@gmail.com',
      title: 'Attendance Clock-In Geo & Time Synchronization',
      description: 'Implement daily automated timestamp check-in / check-out with automatic duration calculation and monthly reports.',
      priority: 'Medium',
      status: 'Pending',
      deadline: '2026-11-28',
      assigned_date: '2026-11-22',
      submission: null,
      mentor_feedback: null,
      is_overdue: false
    },
    {
      id: 'task-105',
      intern_email: 'tejaswisen26@gmail.com',
      title: 'Digital PDF Certificate Generation & Verification Engine',
      description: 'Build downloadable vector PDF completion certificate with unique verification QR code and verification ID.',
      priority: 'Low',
      status: 'Completed',
      deadline: '2026-11-10',
      assigned_date: '2026-11-05',
      submission: {
        github_url: 'https://github.com/tejaswisen/SkilloraPath/pull/39',
        notes: 'Integrated vector canvas preview with download trigger.'
      },
      mentor_feedback: 'Looks very executive and authentic.',
      is_overdue: false
    }
  ];
  for (const t of tasks) {
    await tasksCol.updateOne({ id: t.id }, { $set: t }, { upsert: true });
  }
  console.log(`✅ Seeded ${tasks.length} tasks`);

  // 3. Attendance records
  const attCol = await getAttendanceCollection();
  for (let i = 1; i <= 23; i++) {
    const dayDate = new Date(2026, 10, i);
    const dayOfWeek = dayDate.getDay();
    if (dayOfWeek === 0) continue;

    const dateStr = `2026-11-${String(i).padStart(2, '0')}`;
    const isSaturday = dayOfWeek === 6;
    const status = isSaturday ? (i % 2 === 0 ? 'Half Day' : 'Present') : (i === 12 ? 'Leave' : 'Present');

    const rec = {
      id: `att-202611-${i}`,
      intern_email: 'tejaswisen26@gmail.com',
      intern_id: 'INT-2026-723',
      date: dateStr,
      check_in: status === 'Leave' ? '-' : '09:58 AM',
      check_out: status === 'Leave' ? '-' : (status === 'Half Day' ? '02:00 PM' : '06:34 PM'),
      hours: status === 'Leave' ? 0 : (status === 'Half Day' ? 4.0 : 8.5),
      status,
      notes: status === 'Leave' ? 'Approved medical leave' : 'On-time check-in'
    };
    await attCol.updateOne({ id: rec.id }, { $set: rec }, { upsert: true });
  }
  console.log('✅ Seeded attendance records');

  // 4. Announcements
  const annCol = await getAnnouncementsCollection();
  const announcements = [
    {
      id: 'ann-01',
      title: 'Upcoming Tech Talk: Scaling AI Web Apps to 100k Users',
      date: '2026-11-24',
      author: 'Shashank Shubham (CTO)',
      priority: 'High',
      content: 'Join us this Friday at 4:00 PM for an interactive architectural walkthrough on scaling AI applications.'
    },
    {
      id: 'ann-02',
      title: 'Internship Closure & Pre-Placement Offer (PPO) Evaluations',
      date: '2026-11-18',
      author: 'HR Department',
      priority: 'Normal',
      content: 'Final performance reviews for the current cohort will commence in the first week of December.'
    },
    {
      id: 'ann-03',
      title: 'Monthly Hackathon: AI Agent Solutions 2026',
      date: '2026-11-10',
      author: 'Innovation Hub',
      priority: 'Normal',
      content: 'Registration is now open for all interns. Exciting prize pool and production launch opportunities.'
    }
  ];
  for (const a of announcements) {
    await annCol.updateOne({ id: a.id }, { $set: a }, { upsert: true });
  }
  console.log('✅ Seeded announcements');

  console.log('🎉 Seeding successfully finished!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
