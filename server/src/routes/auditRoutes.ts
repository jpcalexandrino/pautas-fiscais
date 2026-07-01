import express, { Router } from 'express';
import * as AuditController from '../controllers/AuditController';

const router: Router = express.Router();

router.get('/', AuditController.getAll);

export default router;
