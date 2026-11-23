import { Router } from 'express';
import { getJobs, applyJob, getApplications, updateApplicationStatus } from '../controllers/recruitmentController.js';

const router = Router();

router.get('/jobs', getJobs);
router.post('/apply', applyJob);
router.get('/applications', getApplications);
router.put('/applications/:id', updateApplicationStatus);
router.post('/applications/:id/status', updateApplicationStatus);

export default router;

