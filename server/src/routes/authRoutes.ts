import express, { Router } from 'express';
import * as AuthController from '../controllers/AuthController';
import authMiddleware from '../middleware/authMiddleware';

const router: Router = express.Router();

// Public routes
router.post('/login', AuthController.login);

// Protected routes
router.get('/me', authMiddleware, AuthController.me);
router.get('/users', authMiddleware, AuthController.getAll);
router.post('/users', authMiddleware, AuthController.create);
router.put('/users/:id', authMiddleware, AuthController.update);
router.delete('/users/:id', authMiddleware, AuthController.delete);
router.post('/change-password', authMiddleware, AuthController.changePassword);

export default router;
