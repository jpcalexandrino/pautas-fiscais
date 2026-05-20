import express, { Router } from 'express';
import multer from 'multer';
import * as EmailController from '../controllers/EmailController';
import authMiddleware from '../middleware/authMiddleware';

const router: Router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

router.post('/send-pdf', authMiddleware, upload.single('pdf'), EmailController.sendPDF);

export default router;
