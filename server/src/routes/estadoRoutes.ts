import express, { Router } from 'express';
import * as EstadoController from '../controllers/EstadoController';

const router: Router = express.Router();

router.get('/', EstadoController.getAll);

export default router;
