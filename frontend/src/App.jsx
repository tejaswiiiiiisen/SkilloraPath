import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import OverviewView from './views/OverviewView';
import CandidatesView from './views/CandidatesView';
import JobsView from './views/JobsView';
import ApplicationsView from './views/ApplicationsView';
import InternshipTrackingView from './views/InternshipTrackingView';
import CertificatesView from './views/CertificatesView';
import FeedbackView from './views/FeedbackView';
import EmployeesView from './views/EmployeesView';
import DocumentsView from './views/DocumentsView';
import LeadsView from './views/LeadsView';
import FinanceView from './views/FinanceView';
import EventsView from './views/EventsView';
import NotificationsView from './views/NotificationsView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import { DataService } from './services/dataService';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Core Data States
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [interns, setInterns] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [leads, setLeads] = useState([]);
  const [bills, setBills] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all data on mount
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [j, a, cand, emp, intns, ints, fb, l, b, c, ev] = await Promise.all([
        DataService.getJobs(),
        DataService.getApplications(),
        DataService.getCandidates(),
        DataService.getEmployees(),
        DataService.getInterns(),
        DataService.getInterviews(),
        DataService.getFeedback(),
        DataService.getLeads(),
        DataService.getBills(),
        DataService.getCertificates(),
        DataService.getEvents()
      ]);
      setJobs(j || []);
      setApplications(a || []);
      setCandidates(cand || []);
      setEmployees(emp || []);
      setInterns(intns || []);
      setInterviews(ints || []);
      setFeedback(fb || []);
      setLeads(l || []);
      setBills(b || []);
      setCertificates(c || []);
      setEvents(ev || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Supabase Realtime subscriptions
    try {
      const channel = supabase
        .channel('admin_realtime_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
          DataService.getJobs().then(setJobs);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
          DataService.getApplications().then(setApplications);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_submissions' }, () => {
          DataService.getLeads().then(setLeads);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
          DataService.getEmployees().then(setEmployees);
        })
        .subscribe();

      const handleStorage = () => {
        DataService.getApplications().then(setApplications);
        DataService.getCandidates().then(setCandidates);
      };
      window.addEventListener('storage', handleStorage);
      const pollInterval = setInterval(() => {
        DataService.getApplications().then(setApplications);
        DataService.getCandidates().then(setCandidates);
      }, 4000);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('storage', handleStorage);
        clearInterval(pollInterval);
      };
    } catch (e) {
      console.warn('Realtime subscription fallback:', e);
    }
  }, []);

  // Compute operational alerts
  const overdueInternsCount = useMemo(() => {
    return interns.filter(i => {
      const end = new Date(i.extended_end_date || i.end_date);
      return new Date() > end && i.status !== 'Completed';
    }).length;
  }, [interns]);

  const upcomingInterviewsCount = useMemo(() => {
    return interviews.filter(i => i.status === 'Scheduled').length;
  }, [interviews]);

  // Sidebar badge counts
  const counts = {
    candidates: candidates.length || applications.length,
    activeJobs: jobs.filter(j => (j.status || '').toLowerCase() === 'active').length,
    applications: applications.length,
    upcomingInterviews: upcomingInterviewsCount,
    interns: interns.length,
    overdueInterns: overdueInternsCount,
    certificates: certificates.length,
    leads: leads.length,
    alerts: overdueInternsCount
  };

  // Topbar system notifications
  const notifications = useMemo(() => {
    const list = [];
    if (overdueInternsCount > 0) {
      list.push({
        id: 'notif-overdue',
        title: `${overdueInternsCount} Overdue Internship(s)`,
        desc: 'Action required: Complete closure review or extend duration.',
        type: 'alert',
        tab: 'internship-tracking'
      });
    }
    const newLeads = leads.filter(l => l.status === 'New');
    if (newLeads.length > 0) {
      list.push({
        id: 'notif-leads',
        title: `${newLeads.length} New Customer Enquiry`,
        desc: 'Fresh project leads from SkilloraPath public contact form.',
        type: 'lead',
        tab: 'leads'
      });
    }
    return list;
  }, [overdueInternsCount, leads]);

  // Enriched applications combined with candidate database records
  const enrichedApplications = useMemo(() => {
    // Combine all applications first so newly applied candidates appear immediately at the top
    const combined = [...applications];
    for (const cand of candidates) {
      const alreadyExists = combined.some(a => 
        (a.id && cand.id && a.id === cand.id) ||
        (a.email && cand.email && a.email.toLowerCase() === cand.email.toLowerCase()) ||
        (cand.name && a.candidate_name && a.candidate_name.toLowerCase() === cand.name.toLowerCase())
      );
      if (!alreadyExists) {
        combined.push(cand);
      }
    }

    return combined.map((item, index) => {
      const matchApp = applications.find(a => 
        (a.id && item.id && a.id === item.id) ||
        (a.candidate_id && item.candidate_id && a.candidate_id === item.candidate_id) ||
        (a.email && item.email && a.email.toLowerCase() === item.email.toLowerCase()) ||
        (a.candidate_name && item.name && a.candidate_name.toLowerCase() === item.name.toLowerCase())
      );
      const matchJob = jobs.find(j => 
        (j.id && (j.id === item.job_id || j.id === matchApp?.job_id)) ||
        (j.title && (j.title === item.applied_for || j.title === item.job_title || j.title === matchApp?.job_title))
      );

      const name = item.candidate_name || item.name || matchApp?.candidate_name || 'Candidate';
      const cleanEmail = item.email || matchApp?.email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
      const stage = item.stage || item.status || matchApp?.stage || matchApp?.status || 'Applied';

      return {
        id: item.id || matchApp?.id || `cand-${index + 101}`,
        candidate_id: item.candidate_id || matchApp?.candidate_id || `AGX-CND-${index + 101}`,
        candidate_name: name,
        name: name,
        email: cleanEmail,
        phone: item.phone || matchApp?.phone || '+91 98290 77112',
        location: item.location || item.college || matchApp?.location || 'Remote',
        college: item.college || item.location || matchApp?.location || 'Govt Engineering College, Ajmer',
        qualification: item.qualification || item.experience || matchApp?.experience || 'Graduate / Fresher',
        current_year: item.current_year || 'Final Year',
        skills: item.skills || matchApp?.skills || 'React, Node.js, TypeScript',
        experience: item.experience || matchApp?.experience || 'Fresher / Project Experience',
        resume_url: item.resume_url || matchApp?.resume_url || "https://cmpghiavghpdwtyuiuqm.supabase.co/storage/v1/object/public/employee-certs/emp_1782235485946340-MAC/CET/2025/01-1782277556872.pdf",
        job_id: matchJob?.id || item.job_id || matchApp?.job_id || 'job-001',
        job_title: matchJob?.title || item.job_title || item.position || item.applied_for || matchApp?.job_title || matchApp?.position || 'Full Stack Developer Intern',
        applied_for: matchJob?.title || item.applied_for || item.job_title || item.position || matchApp?.job_title || matchApp?.position || 'Full Stack Developer Intern',
        department: matchJob?.department || item.department || matchApp?.department || 'Engineering',
        applied_date: item.applied_date || matchApp?.applied_date || (item.created_at ? item.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
        stage: stage,
        status: stage,
        notes: item.hr_notes || item.notes || matchApp?.hr_remarks || matchApp?.notes || '',
        profile_picture: item.profile_picture || matchCandAvatar(index)
      };
    });
  }, [applications, candidates, jobs]);

  function matchCandAvatar(idx) {
    const avatars = ['/review/client_1.webp', '/review/shakir-review.webp', '/review/manas-review.webp', '/review/client_3.webp', '/review/client_2.webp'];
    return avatars[idx % avatars.length];
  }

  // Handlers
  const handleSaveJob = async (jobData) => {
    await DataService.saveJob(jobData);
    const updated = await DataService.getJobs();
    setJobs(updated);
  };

  const handleDeleteJob = async (jobId) => {
    const updated = await DataService.deleteJob(jobId);
    setJobs(updated);
  };

  const handleUpdateAppStatus = async (appId, status, newAppData) => {
    if (newAppData) {
      await DataService.saveApplication(newAppData);
    } else {
      await DataService.updateApplicationStatus(appId, status);
    }
    const updated = await DataService.getApplications();
    setApplications(updated);
  };

  const handleUpdateAppNotes = async (appId, notes) => {
    const app = applications.find(a => a.id === appId);
    if (app) {
      const updated = { ...app, hr_remarks: notes };
      await DataService.saveApplication(updated);
      const all = await DataService.getApplications();
      setApplications(all);
    }
  };

  const handleSaveIntern = async (internData) => {
    await DataService.saveIntern(internData);
    const updated = await DataService.getInterns();
    setInterns(updated);
  };

  const handleSaveInterview = async (interviewData) => {
    await DataService.saveInterview(interviewData);
    const updated = await DataService.getInterviews();
    setInterviews(updated);
  };

  const handleSaveFeedback = async (fbData) => {
    await DataService.saveFeedback(fbData);
    const updated = await DataService.getFeedback();
    setFeedback(updated);
  };

  const handleGenerateCertificate = async (certData) => {
    await DataService.generateCertificate(certData);
    const updated = await DataService.getCertificates();
    setCertificates(updated);
  };

  const handleSaveEmployee = async (empData) => {
    await DataService.saveEmployee(empData);
    const updated = await DataService.getEmployees();
    setEmployees(updated);
  };

  const handleDeleteEmployee = async (empId) => {
    const updated = await DataService.deleteEmployee(empId);
    setEmployees(updated);
  };

  const handleSaveBill = async (billData) => {
    await DataService.saveBill(billData);
    const updated = await DataService.getBills();
    setBills(updated);
  };

  const handleDeleteBill = async (billId) => {
    const updated = await DataService.deleteBill(billId);
    setBills(updated);
  };

  const handleSaveEvent = async (eventData) => {
    const updated = await DataService.getEvents();
    setEvents(updated);
  };

  const handleDeleteEvent = async (eventId) => {
    const updated = await DataService.getEvents();
    setEvents(updated);
  };

  const handleUpdateLeadStatus = async (leadId, status) => {
    const current = await DataService.getLeads();
    const updated = current.map(l => l.id === leadId ? { ...l, status } : l);
    setLeads(updated);
  };

  // Quick Action Handler from Topbar
  const handleQuickAction = (action) => {
    if (action === 'add-job') setActiveTab('jobs');
    if (action === 'add-employee') setActiveTab('employees');
    if (action === 'add-bill') setActiveTab('finance');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={counts}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 transition-all">
        {/* Top Header */}
        <Topbar
          activeTab={activeTab}
          onOpenMobile={() => setIsMobileOpen(true)}
          notifications={notifications}
          onQuickAction={handleQuickAction}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          onNotificationClick={(n) => {
            if (n.tab) setActiveTab(n.tab);
          }}
        />

        {/* Dynamic View Mount */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              jobs={jobs}
              applications={applications}
              interns={interns}
              interviews={interviews}
              leads={leads}
              bills={bills}
              onNavigateTab={setActiveTab}
              onSelectCandidate={setSelectedCandidate}
              onQuickAction={handleQuickAction}
            />
          )}

          {activeTab === 'candidates' && (
            <CandidatesView
              applications={enrichedApplications}
              jobs={jobs}
              interns={interns}
              onUpdateStatus={handleUpdateAppStatus}
              onUpdateNotes={handleUpdateAppNotes}
              selectedCandidate={selectedCandidate}
              setSelectedCandidate={setSelectedCandidate}
            />
          )}

          {activeTab === 'jobs' && (
            <JobsView
              jobs={jobs}
              applications={applications}
              onSaveJob={handleSaveJob}
              onDeleteJob={handleDeleteJob}
              onNavigateTab={setActiveTab}
              onFilterCandidateByJob={(jobId) => {
                setActiveTab('candidates');
              }}
            />
          )}

          {activeTab === 'applications' && (
            <ApplicationsView
              applications={enrichedApplications}
              onUpdateStatus={handleUpdateAppStatus}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'internship-tracking' && (
            <InternshipTrackingView
              interns={interns}
              onSaveIntern={handleSaveIntern}
              onGenerateCertificate={handleGenerateCertificate}
            />
          )}

          {activeTab === 'certificates' && (
            <CertificatesView
              certificates={certificates}
            />
          )}

          {activeTab === 'feedback' && (
            <FeedbackView
              feedback={feedback}
              onSaveFeedback={handleSaveFeedback}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeesView
              employees={employees}
              onSaveEmployee={handleSaveEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              employees={employees}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsView
              leads={leads}
              onUpdateStatus={handleUpdateLeadStatus}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceView
              bills={bills}
              onSaveBill={handleSaveBill}
              onDeleteBill={handleDeleteBill}
            />
          )}

          {activeTab === 'events' && (
            <EventsView
              events={events}
              onSaveEvent={handleSaveEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              interns={interns}
              leads={leads}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              applications={applications}
              jobs={jobs}
              employees={employees}
              leads={leads}
              bills={bills}
              certificates={certificates}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  );
}
