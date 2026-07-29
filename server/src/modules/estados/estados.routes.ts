import express, { Router } from 'express';
import * as EstadoController from './estados.controller';

const router: Router = express.Router();

router.get('/', EstadoController.getAll);

export default router;
