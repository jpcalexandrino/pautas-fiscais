import express, { Router } from 'express';
import * as ClientController from '../controllers/ClientController';

const router: Router = express.Router();

router.get('/', ClientController.getAll);
router.get('/:id', ClientController.getById);
router.post('/', ClientController.create);
router.post('/bulk', ClientController.bulkCreate);
router.put('/:id', ClientController.update);
router.delete('/:id', ClientController.delete);

export default router;
