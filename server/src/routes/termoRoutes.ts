import express, { Router } from 'express';
import * as TermoController from '../controllers/TermoController';

const router: Router = express.Router();

router.get('/', TermoController.getAll);
router.post('/', TermoController.create);
router.delete('/:id', TermoController.delete);

export default router;
