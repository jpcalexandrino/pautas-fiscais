import express, { Router } from 'express';
import multer from 'multer';
import * as PautaController from '../controllers/PautaController';

const router: Router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  },
});

router.post('/upload', upload.single('file'), PautaController.upload);
router.get('/', PautaController.getAll);
router.get('/ocr-files', PautaController.getArquivosOcr);
router.get('/ocr-files/:filename', PautaController.getArquivoOcrByFilename);
router.get('/ocr-files/:filename/tabelas', PautaController.getTabelasOcr);
router.put('/ocr-files/:filename/tabelas', PautaController.updateTabelasOcr);
router.post('/confirmar-manual', PautaController.confirmarManual);
router.delete('/ocr-files/:filename', PautaController.excluirArquivoOcr);
router.get('/:id/related', PautaController.getRelatedPautas);
router.delete('/:id', PautaController.excluirPauta);

export default router;
