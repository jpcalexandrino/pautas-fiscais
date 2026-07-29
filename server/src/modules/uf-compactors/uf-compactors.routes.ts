import express, { Router } from 'express';
import * as UfCompactorController from './uf-compactors.controller';

const router: Router = express.Router();

router.get('/', UfCompactorController.getAllConfigs);
router.get('/:uf', UfCompactorController.getConfigByUf);
router.put('/:uf', UfCompactorController.updateConfig);
router.delete('/:uf', UfCompactorController.deleteConfig);

export default router;
