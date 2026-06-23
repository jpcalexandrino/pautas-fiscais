import express, { Router } from 'express';
import multer from 'multer';
import * as ProdutoController from '../controllers/ProdutoController';

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

router.get('/', ProdutoController.getAll);
router.get('/:id', ProdutoController.getById);
router.post('/', ProdutoController.create);
router.put('/:id', ProdutoController.update);
router.delete('/:id', ProdutoController.delete);
router.post('/bulk', upload.single('file'), ProdutoController.bulkImport);

export default router;
