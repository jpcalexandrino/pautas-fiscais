import express, { Router } from 'express';
import * as AIController from '../controllers/AIController';

const router: Router = express.Router();

router.post('/optimize', AIController.getOptimizationSuggestions);

export default router;
