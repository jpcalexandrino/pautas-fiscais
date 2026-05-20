import express, { Router } from 'express';
import * as EquipmentController from '../controllers/EquipmentController';

const router: Router = express.Router();

router.get('/client/:clientId', EquipmentController.getByClient);
router.post('/', EquipmentController.create);
router.put('/:id', EquipmentController.update);
router.delete('/:id', EquipmentController.delete);

export default router;
