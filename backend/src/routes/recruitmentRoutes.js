import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getJobs,
  applyJob,
  getApplications,
  updateApplicationStatus,
  uploadResume,
  getRecords,
  saveRecord,
  getPortalCredentials,
  savePortalCredential
} from '../controllers/recruitmentController.js';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve('D:/skillora/backend/uploads/resumes');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }
});

const router = Router();

router.get('/jobs', getJobs);
router.post('/apply', applyJob);
router.get('/applications', getApplications);
router.put('/applications/:id', updateApplicationStatus);
router.post('/applications/:id', updateApplicationStatus);
router.post('/applications/:id/status', updateApplicationStatus);
router.post('/upload-resume', upload.single('resume'), uploadResume);
router.get('/records', getRecords);
router.post('/records', saveRecord);
router.get('/portal-credentials', getPortalCredentials);
router.post('/portal-credentials', savePortalCredential);
router.get('/credentials', getPortalCredentials);
router.post('/credentials', savePortalCredential);

export default router;

