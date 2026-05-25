import './config/env';
import express from 'express';
import type { Application } from 'express';
import cors from 'cors';
import path from 'path';
import faturaRoutes from './routes/faturaRoutes';
import clientRoutes from './routes/clientRoutes';
import equipmentRoutes from './routes/equipmentRoutes';
import aiRoutes from './routes/aiRoutes';
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import userRoutes from './routes/userRoutes';
import authMiddleware from './middleware/authMiddleware';

import FaturaRepository from './repositories/FaturaRepository';
import ClientRepository from './repositories/ClientRepository';
import EquipmentRepository from './repositories/EquipmentRepository';
import UserRepository from './repositories/UserRepository';

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
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/faturas', authMiddleware, faturaRoutes);
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/equipment', authMiddleware, equipmentRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/email', emailRoutes);

// Em produção, servir o frontend buildado pelo Vite
if (isProduction) {
  const clientDistPath = path.join(__dirname, '../../dist');
  app.use(express.static(clientDistPath));

  // SPA fallback — qualquer rota que não seja /api retorna index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Database initialization
async function init(): Promise<void> {
  try {
    await UserRepository.createTable();
    await FaturaRepository.createTable();
    await ClientRepository.createTable();
    await EquipmentRepository.createTable();

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
