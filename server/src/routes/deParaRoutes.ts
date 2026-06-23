import express, { Router } from 'express';
import multer from 'multer';
import * as DeParaController from '../controllers/DeParaController';

const router: Router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // limite de 10MB
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/csv' ||
      ext.endsWith('.xlsx') ||
      ext.endsWith('.xls') ||
      ext.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel (.xlsx, .xls) ou CSV são permitidos'));
    }
  },
});

router.get('/', DeParaController.getAll);
router.get('/:id', DeParaController.getById);
router.post('/', DeParaController.create);
router.put('/:id', DeParaController.update);
router.delete('/:id', DeParaController.delete);
router.post('/bulk', upload.single('file'), DeParaController.bulkImport);

export default router;
