import type { Application } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/users.routes';
import produtoRoutes from '../modules/produtos/produtos.routes';
import estadoRoutes from '../modules/estados/estados.routes';
import deParaRoutes from '../modules/de-para/de-para.routes';
import pautaRoutes from '../modules/pautas/pautas.routes';
import termoRoutes from '../modules/termos/termos.routes';
import ufCompactorRoutes from '../modules/uf-compactors/uf-compactors.routes';
import auditRoutes from '../modules/audit/audit.routes';
import authMiddleware from '../shared/middleware/authMiddleware';

export function registerRoutes(app: Application): void {
  app.use('/api/auth', authRoutes);

  app.use('/api/users', authMiddleware, userRoutes);
  app.use('/api/produtos', authMiddleware, produtoRoutes);
  app.use('/api/estados', authMiddleware, estadoRoutes);
  app.use('/api/de-para', authMiddleware, deParaRoutes);
  app.use('/api/pautas', authMiddleware, pautaRoutes);
  app.use('/api/config/termos', authMiddleware, termoRoutes);
  app.use('/api/config/uf-compactors', authMiddleware, ufCompactorRoutes);
  app.use('/api/audit', authMiddleware, auditRoutes);
}
