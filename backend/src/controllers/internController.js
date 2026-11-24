import {
  getInternsCollection,
  getTasksCollection,
  getAttendanceCollection,
  getLeavesCollection,
  getResourcesCollection,
  getAnnouncementsCollection,
  getMessagesCollection,
  getPerformanceCollection,
  getPortalCredentialsCollection
} from '../config/mongodb.js';

// Helper to extract intern identifier (email or intern_id or username) from headers or query
function getInternIdentifier(req) {
  return (
    req.headers['x-intern-email'] ||
    req.headers['x-intern-id'] ||
    req.headers['x-intern-username'] ||
    req.query.email ||
    req.query.username ||
    req.query.intern_id ||
    'tejaswisen26@gmail.com'
  ).toString().trim().toLowerCase();
}

// 1. GET /api/intern/profile
export async function getProfile(req, res) {
  try {
    const ident = getInternIdentifier(req);
    const col = await getInternsCollection();
    let intern = null;

    if (col) {
      intern = await col.findOne({
        $or: [
          { email: ident },
          { intern_id: ident.toUpperCase() },
          { portal_username: ident }
        ]
      });
    }

    // Default fallback if database not seeded yet
    if (!intern) {
      intern = {
        id: 'intern-default',
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
        description: 'Focusing on full stack development, high-performance web applications, and enterprise microservice architectures.'
      };
    } else {
      delete intern._id;
    }

    res.json({ success: true, data: intern });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 2. PUT /api/intern/profile
export async function updateProfile(req, res) {
  try {
    const ident = getInternIdentifier(req);
    const updates = req.body || {};
    delete updates._id;

    const col = await getInternsCollection();
    if (col) {
      await col.updateOne(
        {
          $or: [
            { email: ident },
            { intern_id: ident.toUpperCase() },
            { portal_username: ident }
          ]
        },
        { $set: { ...updates, updated_at: new Date().toISOString() } },
        { upsert: true }
      );
    }

    res.json({ success: true, message: 'Profile updated successfully', data: updates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 3. GET /api/intern/dashboard-overview
export async function getDashboardOverview(req, res) {
  try {
    const ident = getInternIdentifier(req);
    const [tasksCol, attCol, annCol, perfCol, intCol] = await Promise.all([
      getTasksCollection(),
      getAttendanceCollection(),
      getAnnouncementsCollection(),
      getPerformanceCollection(),
      getInternsCollection()
    ]);

    // Fetch intern details
    let intern = null;
    if (intCol) {
      intern = await intCol.findOne({
        $or: [{ email: ident }, { portal_username: ident }, { intern_id: ident.toUpperCase() }]
      });
    }

    // Tasks summary
    let tasks = [];
    if (tasksCol) {
      tasks = await tasksCol.find({
        $or: [{ intern_email: ident }, { intern_id: ident.toUpperCase() }, { intern_email: 'all' }]
      }).sort({ deadline: 1 }).toArray();
    }

    const totalTasks = tasks.length || 6;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length || 4;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length || 1;
    const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'Submitted').length || 1;
    const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 75;

    // Attendance summary
    let attendance = [];
    if (attCol) {
      attendance = await attCol.find({
        $or: [{ intern_email: ident }, { intern_id: ident.toUpperCase() }]
      }).toArray();
    }
    const totalDays = attendance.length || 24;
    const presentDays = attendance.filter(a => a.status === 'Present').length || 23;
    const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 96;

    // Recent announcements
    let announcements = [];
    if (annCol) {
      announcements = await annCol.find({}).sort({ date: -1 }).limit(3).toArray();
    }

    // Upcoming deadlines
    const upcomingDeadlines = tasks
      .filter(t => t.status !== 'Completed')
      .slice(0, 3)
      .map(t => ({ id: t.id, title: t.title, deadline: t.deadline, priority: t.priority }));

    res.json({
      success: true,
      data: {
        intern: intern || {
          name: 'Tejaswi Sen',
          email: 'tejaswisen26@gmail.com',
          role: 'Full Stack Software Engineering Intern',
          department: 'Engineering & AI Solutions',
          start_date: '2026-06-01',
          end_date: '2026-12-31'
        },
        stats: {
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          in_progress_tasks: inProgressTasks,
          pending_tasks: pendingTasks,
          internship_progress: progressPct,
          attendance_pct: attendancePct,
          total_working_days: totalDays,
          overall_performance_rating: intern?.performance_rating || 4.9
        },
        upcomingDeadlines,
        recentAnnouncements: announcements.map(({ _id, ...rest }) => rest),
        latestMentorFeedback: {
          mentor: 'Shashank Shubham',
          date: '2026-11-20',
          rating: 5.0,
          comment: 'Outstanding contribution to the backend API architecture. High attention to detail and proactive problem solving.'
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 4. GET /api/intern/tasks
export async function getTasks(req, res) {
  try {
    const ident = getInternIdentifier(req);
    const col = await getTasksCollection();
    let tasks = [];
    if (col) {
      tasks = await col.find({
        $or: [{ intern_email: ident }, { intern_id: ident.toUpperCase() }, { intern_email: 'all' }]
      }).sort({ deadline: 1 }).toArray();
    }

    // Fallback seed tasks if database collection is empty
    if (!tasks || tasks.length === 0) {
      tasks = [
        {
          id: 'task-101',
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
    } else {
      tasks = tasks.map(({ _id, ...rest }) => rest);
    }

    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 5. POST /api/intern/tasks/:id/submit
export async function submitTask(req, res) {
  try {
    const { id } = req.params;
    const { github_url, notes, live_url } = req.body;
    const col = await getTasksCollection();

    const submissionData = {
      github_url: github_url || '',
      live_url: live_url || '',
      notes: notes || '',
      submitted_at: new Date().toISOString()
    };

    if (col) {
      await col.updateOne(
        { id },
        {
          $set: {
            status: 'Submitted',
            submission: submissionData,
            updated_at: new Date().toISOString()
          }
        },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: 'Task submitted successfully for mentor review!',
      data: { id, status: 'Submitted', submission: submissionData }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 6. GET /api/intern/attendance
export async function getAttendance(req, res) {
  try {
    const ident = getInternIdentifier(req);
    const col = await getAttendanceCollection();
    let records = [];
    if (col) {
      records = await col.find({
        $or: [{ intern_email: ident }, { intern_id: ident.toUpperCase() }]
      }).sort({ date: -1 }).toArray();
    }

    if (!records || records.length === 0) {
      // Generate realistic November 2026 attendance records
      const dummyRecords = [];
      const today = new Date();
      for (let i = 1; i <= 23; i++) {
        const dayDate = new Date(2026, 10, i);
        const dayOfWeek = dayDate.getDay();
        if (dayOfWeek === 0) continue; // Skip Sunday

        const dateStr = `2026-11-${String(i).padStart(2, '0')}`;
        const isSaturday = dayOfWeek === 6;
        const status = isSaturday ? (i % 2 === 0 ? 'Half Day' : 'Present') : (i === 12 ? 'Leave' : 'Present');

        dummyRecords.push({
          id: `att-202611-${i}`,
          date: dateStr,
          check_in: status === 'Leave' ? '-' : '09:58 AM',
          check_out: status === 'Leave' ? '-' : (status === 'Half Day' ? '02:00 PM' : '06:34 PM'),
          hours: status === 'Leave' ? 0 : (status === 'Half Day' ? 4.0 : 8.5),
          status,
          notes: status === 'Leave' ? 'Approved medical leave' : 'On-time check-in'
        });
      }
      records = dummyRecords;
    } else {
      records = records.map(({ _id, ...rest }) => rest);
    }

    const totalWorkingDays = records.length;
    const presentCount = records.filter(r => r.status === 'Present').length;
    const halfDayCount = records.filter(r => r.status === 'Half Day').length;
    const leaveCount = records.filter(r => r.status === 'Leave').length;
    const attendancePct = totalWorkingDays > 0 ? Math.round(((presentCount + halfDayCount * 0.5) / totalWorkingDays) * 100) : 96;

    res.json({
      success: true,
      data: {
        history: records,
        summary: {
          total_working_days: totalWorkingDays,
          present_days: presentCount,
          half_days: halfDayCount,
          leaves_taken: leaveCount,
          attendance_percentage: attendancePct
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 7. POST /api/intern/attendance/checkin
export async function checkIn(req, res) {
  try {
    const ident = getInternIdentifier(req);
    const todayStr = new Date().toISOString().slice(0, 10);
    const col = await getAttendanceCollection();

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newRecord = {
      id: `att-${todayStr}-${Date.now().toString().slice(-4)}`,
      intern_email: ident,
      date: todayStr,
      check_in: timeStr,
      check_out: '-',
      hours: 0,
      status: 'Present',
      notes: 'Self Web Check-in',
      timestamp: new Date().toISOString()
    };

    if (col) {
      await col.updateOne(
        { intern_email: ident, date: todayStr },
        { $setOnInsert: newRecord },
        { upsert: true }
      );
    }

    res.json({ success: true, message: `Checked in successfully at ${timeStr}!`, data: newRecord });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 8. POST /api/intern/attendance/checkout
export async function checkOut(req, res) {
  try {
    const ident = getInternIdentifier(req);
    const todayStr = new Date().toISOString().slice(0, 10);
    const col = await getAttendanceCollection();

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (col) {
      await col.updateOne(
        { intern_email: ident, date: todayStr },
        {
          $set: {
            check_out: timeStr,
            hours: 8.5,
            updated_at: new Date().toISOString()
          }
        }
      );
    }

    res.json({ success: true, message: `Checked out successfully at ${timeStr}! Have a great evening.`, data: { check_out: timeStr } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 9. GET /api/intern/leaves
export async function getLeaves(req, res) {
  try {
    const ident = getInternIdentifier(req);
    const col = await getLeavesCollection();
    let leaves = [];
    if (col) {
      leaves = await col.find({
        $or: [{ intern_email: ident }, { intern_id: ident.toUpperCase() }]
      }).sort({ applied_on: -1 }).toArray();
    }

    if (!leaves || leaves.length === 0) {
      leaves = [
        {
          id: 'leave-01',
          type: 'Medical Leave',
          start_date: '2026-11-12',
          end_date: '2026-11-12',
          total_days: 1,
          reason: 'Fever and doctor consultation.',
          status: 'Approved',
          applied_on: '2026-11-11',
          admin_remarks: 'Approved. Take care and get well soon.'
        },
        {
          id: 'leave-02',
          type: 'Academic / Exam Leave',
          start_date: '2026-12-08',
          end_date: '2026-12-10',
          total_days: 3,
          reason: 'University 7th Semester Mid-Term Examinations.',
          status: 'Pending',
          applied_on: '2026-11-20',
          admin_remarks: 'Under review by HR & Mentor.'
        }
      ];
    } else {
      leaves = leaves.map(({ _id, ...rest }) => rest);
    }

    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 10. POST /api/intern/leaves/apply
export async function applyLeave(req, res) {
  try {
    const ident = getInternIdentifier(req);
    const { leave_type, start_date, end_date, reason } = req.body;

    const start = new Date(start_date);
    const end = new Date(end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newLeave = {
      id: `leave-${Date.now().toString().slice(-6)}`,
      intern_email: ident,
      type: leave_type || 'Casual Leave',
      start_date,
      end_date,
      total_days: diffDays > 0 ? diffDays : 1,
      reason: reason || 'Personal emergency',
      status: 'Pending',
      applied_on: new Date().toISOString().slice(0, 10),
      admin_remarks: 'Submitted for Admin / Mentor approval.'
    };

    const col = await getLeavesCollection();
    if (col) {
      await col.insertOne(newLeave);
    }

    res.json({ success: true, message: 'Leave application submitted successfully!', data: newLeave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 11. GET /api/intern/performance
export async function getPerformance(req, res) {
  try {
    const ident = getInternIdentifier(req);
    const col = await getPerformanceCollection();
    let perf = null;
    if (col) {
      perf = await col.findOne({
        $or: [{ intern_email: ident }, { intern_id: ident.toUpperCase() }]
      });
    }

    if (!perf) {
      perf = {
        overall_score: 94,
        rating: 4.9,
        evaluator: 'Shashank Shubham (Tech Lead)',
        last_evaluated: '2026-11-20',
        skills: [
          { skill: 'React & Frontend Architecture', score: 96, level: 'Advanced' },
          { skill: 'Node.js & REST API Design', score: 92, level: 'Proficient' },
          { skill: 'MongoDB & Database Optimization', score: 90, level: 'Proficient' },
          { skill: 'Code Quality & Clean Architecture', score: 95, level: 'Advanced' },
          { skill: 'Team Collaboration & Communication', score: 98, level: 'Exceptional' }
        ],
        strengths: [
          'High development velocity and quick grasp of complex architectures',
          'Autonomous problem solver with excellent debugging skills',
          'Clean, maintainable, and self-documenting code'
        ],
        improvements: [
          'Deepen knowledge of microservice caching with Redis',
          'Expand automated end-to-end testing with Playwright'
        ],
        mentor_review: 'Tejaswi has shown exceptional growth throughout the internship tenure. Consistently surpasses performance expectations.'
      };
    } else {
      delete perf._id;
    }

    res.json({ success: true, data: perf });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 12. GET /api/intern/resources
export async function getResources(req, res) {
  try {
    const resources = [
      {
        id: 'res-1',
        title: 'SkilloraPath Engineering Best Practices & Architecture Guide',
        category: 'Documentation',
        type: 'PDF',
        url: 'https://skillorapath.com/docs/engineering-guide.pdf',
        size: '2.4 MB',
        date: '2026-06-15',
        description: 'Code style guidelines, Git branch workflows, pull request conventions, and architecture standards.'
      },
      {
        id: 'res-2',
        title: 'Full Stack Microservices Masterclass (Internal Video)',
        category: 'Training Videos',
        type: 'Video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '45 mins',
        date: '2026-07-01',
        description: 'Recorded session covering distributed state management, API gateways, and MongoDB query tuning.'
      },
      {
        id: 'res-3',
        title: 'React 19 & Tailwind CSS Design System Kit',
        category: 'Technical Documentation',
        type: 'Repository',
        url: 'https://github.com/tejaswisen/skillorapath-ui-kit',
        date: '2026-08-10',
        description: 'Component patterns, glassmorphism cards, responsive layouts, and accessibility guidelines.'
      },
      {
        id: 'res-4',
        title: 'REST API Security & Authentication Protocol',
        category: 'Documentation',
        type: 'PDF',
        url: 'https://skillorapath.com/docs/api-security-guide.pdf',
        size: '1.8 MB',
        date: '2026-09-05',
        description: 'JWT token lifecycle, CSRF protection, input sanitation, and role-based access control.'
      },
      {
        id: 'res-5',
        title: 'Weekly Coding Assignment: Distributed Rate Limiter',
        category: 'Assignments',
        type: 'Assignment',
        url: 'https://skillorapath.com/assignments/rate-limiter.md',
        deadline: '2026-11-30',
        date: '2026-11-20',
        description: 'Hands-on project to implement a token bucket algorithm middleware for Express.js.'
      }
    ];

    res.json({ success: true, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 13. GET /api/intern/announcements
export async function getAnnouncements(req, res) {
  try {
    const col = await getAnnouncementsCollection();
    let announcements = [];
    if (col) {
      announcements = await col.find({}).sort({ date: -1 }).toArray();
    }

    if (!announcements || announcements.length === 0) {
      announcements = [
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
    } else {
      announcements = announcements.map(({ _id, ...rest }) => rest);
    }

    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 14. GET /api/intern/messages & POST /api/intern/messages/send
export async function getMessages(req, res) {
  try {
    const ident = getInternIdentifier(req);
    const col = await getMessagesCollection();
    let messages = [];
    if (col) {
      messages = await col.find({
        $or: [{ intern_email: ident }, { intern_id: ident.toUpperCase() }]
      }).sort({ timestamp: 1 }).toArray();
    }

    if (!messages || messages.length === 0) {
      messages = [
        {
          id: 'msg-1',
          sender: 'mentor',
          sender_name: 'Shashank Shubham',
          sender_role: 'Lead Mentor',
          text: 'Hi Tejaswi! Great job on finishing the MongoDB Atlas integration yesterday.',
          timestamp: '2026-11-22T10:15:00.000Z'
        },
        {
          id: 'msg-2',
          sender: 'intern',
          sender_name: 'Tejaswi Sen',
          sender_role: 'Intern',
          text: 'Thanks Shashank! Everything is synced with DNS fallback. Currently implementing the Trainee Portal.',
          timestamp: '2026-11-22T10:20:00.000Z'
        },
        {
          id: 'msg-3',
          sender: 'mentor',
          sender_name: 'Shashank Shubham',
          sender_role: 'Lead Mentor',
          text: 'Awesome. Ping me if you need help with certificate generation or the attendance sync.',
          timestamp: '2026-11-22T10:25:00.000Z'
        }
      ];
    } else {
      messages = messages.map(({ _id, ...rest }) => rest);
    }

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function sendMessage(req, res) {
  try {
    const ident = getInternIdentifier(req);
    const { text, sender_name } = req.body;

    const newMessage = {
      id: `msg-${Date.now()}`,
      intern_email: ident,
      sender: 'intern',
      sender_name: sender_name || 'Intern',
      sender_role: 'Intern',
      text: text || '',
      timestamp: new Date().toISOString()
    };

    const col = await getMessagesCollection();
    if (col) {
      await col.insertOne(newMessage);
    }

    res.json({ success: true, message: 'Message sent', data: newMessage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// 15. GET /api/intern/certificate
export async function getCertificate(req, res) {
  try {
    const ident = getInternIdentifier(req);
    const col = await getInternsCollection();
    let intern = null;
    if (col) {
      intern = await col.findOne({
        $or: [{ email: ident }, { portal_username: ident }]
      });
    }

    const certData = {
      intern_id: intern?.intern_id || 'INT-2026-723',
      name: intern?.name || 'Tejaswi Sen',
      role: intern?.role || 'Full Stack Software Engineering Intern',
      department: intern?.department || 'Engineering',
      start_date: intern?.start_date || '2026-06-01',
      end_date: intern?.end_date || '2026-12-31',
      duration: '6 Months',
      status: 'Ready', // 'Ready' | 'In Progress' | 'Issued'
      certificate_id: 'SKILLORA-CERT-2026-7237',
      issued_date: '2026-11-23',
      grade: 'Distinction (A+)',
      performance_rating: 4.9,
      verification_url: 'https://skillorapath.com/verify/SKILLORA-CERT-2026-7237',
      signatories: [
        { name: 'Tejaswi Sen', title: 'Founder & CEO, SkilloraPath' },
        { name: 'Shashank Shubham', title: 'Head of Engineering' }
      ]
    };

    res.json({ success: true, data: certData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
