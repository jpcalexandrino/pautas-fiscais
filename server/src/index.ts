import './config/env';
import express from 'express';
import type { Application } from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import produtoRoutes from './routes/produtoRoutes';
import estadoRoutes from './routes/estadoRoutes';
import deParaRoutes from './routes/deParaRoutes';
import pautaRoutes from './routes/pautaRoutes';
import termoRoutes from './routes/termoRoutes';
import auditRoutes from './routes/auditRoutes';
import authMiddleware from './middleware/authMiddleware';

import UserRepository from './repositories/UserRepository';
import ProdutoRepository from './repositories/ProdutoRepository';
import EstadoRepository from './repositories/EstadoRepository';
import CalendarioRepository from './repositories/CalendarioRepository';
import DeParaProdutoEstadoRepository from './repositories/DeParaProdutoEstadoRepository';
import PautaFiscalRepository from './repositories/PautaFiscalRepository';
import TermoRepository from './repositories/TermoRepository';
import AuditRepository from './repositories/AuditRepository';
import { loadBrandSlugsFromDb } from './services/brandSlugs';

const app: Application = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';


// CORS: restrito em produção, aberto em desenvolvimento
app.use(cors(
  isProduction
    ? { origin: process.env.CORS_ORIGIN || false }
    : { origin: true }
));
app.use(express.json({ limit: '10mb' }));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/produtos', authMiddleware, produtoRoutes);
app.use('/api/estados', authMiddleware, estadoRoutes);
app.use('/api/de-para', authMiddleware, deParaRoutes);
app.use('/api/pautas', authMiddleware, pautaRoutes);
app.use('/api/config/termos', authMiddleware, termoRoutes);
app.use('/api/audit', authMiddleware, auditRoutes);

// Em produção, servir o frontend buildado pelo Vite
if (isProduction) {
  const clientDistPath = path.join(__dirname, '../../dist');
  app.use(express.static(clientDistPath));

  // SPA fallback — qualquer rota que não seja /api retorna index.html
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Database initialization
async function init(): Promise<void> {
  try {
    await UserRepository.createTable();
    await EstadoRepository.createTable();
    await CalendarioRepository.createTable();
    await ProdutoRepository.createTable();
    await DeParaProdutoEstadoRepository.createTable();
    await PautaFiscalRepository.createTable();
    await TermoRepository.createTable();
    await AuditRepository.createTable();
    await TermoRepository.seed();
    await loadBrandSlugsFromDb();
    await EstadoRepository.seed();
    await CalendarioRepository.seed();

    // Seed default admin if no users exist
    const usersResult = await UserRepository.getAll();
    if ((usersResult.rowCount || 0) === 0) {
      await UserRepository.create({
        nome: 'Administrador',
        email: 'admin@admin.com',
        senha_hash: 'Admin#1234',
        perfil: 'admin'
      });
      console.log('Default admin user seeded: admin@admin.com / Admin#1234');
    }

    console.log('Database initialized');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

init();
