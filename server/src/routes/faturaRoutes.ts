import express, { Router } from 'express';
import multer from 'multer';
import * as FaturaController from '../controllers/FaturaController';

const router: Router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/upload', upload.single('file'), FaturaController.upload);
router.post('/sync-powerhub', FaturaController.syncPowerHub);
router.post('/', FaturaController.save);
router.get('/', FaturaController.getAll);

export default router;
