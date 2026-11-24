import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getDashboardOverview,
  getTasks,
  submitTask,
  getAttendance,
  checkIn,
  checkOut,
  getLeaves,
  applyLeave,
  getPerformance,
  getResources,
  getAnnouncements,
  getMessages,
  sendMessage,
  getCertificate
} from '../controllers/internController.js';

const router = Router();

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/dashboard-overview', getDashboardOverview);
router.get('/tasks', getTasks);
router.post('/tasks/:id/submit', submitTask);
router.get('/attendance', getAttendance);
router.post('/attendance/checkin', checkIn);
router.post('/attendance/checkout', checkOut);
router.get('/leaves', getLeaves);
router.post('/leaves/apply', applyLeave);
router.get('/performance', getPerformance);
router.get('/resources', getResources);
router.get('/announcements', getAnnouncements);
router.get('/messages', getMessages);
router.post('/messages/send', sendMessage);
router.get('/certificate', getCertificate);

export default router;
