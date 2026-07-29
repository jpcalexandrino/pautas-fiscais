import express, { Router } from 'express';
import * as AuditController from './audit.controller';

const router: Router = express.Router();

router.get('/', AuditController.getAll);

export default router;
