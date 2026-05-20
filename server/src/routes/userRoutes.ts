import express, { Router } from 'express';
import * as UserController from '../controllers/UserController';

const router: Router = express.Router();

router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.post('/', UserController.create);
router.put('/:id', UserController.update);
router.post('/:id/reset-password', UserController.resetPassword);
router.delete('/:id', UserController.delete);

export default router;
