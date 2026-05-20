import express from 'express';
import type { Application } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
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

dotenv.config({ path: path.join(__dirname, '../.env') });

const app: Application = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 3001;

app.use(cors());
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

// Database initialization
async function init(): Promise<void> {
  try {
    await UserRepository.createTable();
    await FaturaRepository.createTable();
    await ClientRepository.createTable();
    await EquipmentRepository.createTable();
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
