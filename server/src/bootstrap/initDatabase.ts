import UserRepository from '../modules/users/users.repository';
import ProdutoRepository from '../modules/produtos/produtos.repository';
import EstadoRepository from '../modules/estados/estados.repository';
import CalendarioRepository from '../modules/estados/calendario.repository';
import DeParaProdutoEstadoRepository from '../modules/de-para/de-para.repository';
import PautaFiscalRepository from '../modules/pautas/pautas.repository';
import TermoRepository from '../modules/termos/termos.repository';
import UfCompactorRepository from '../modules/uf-compactors/uf-compactors.repository';
import AuditRepository from '../modules/audit/audit.repository';
import { loadBrandSlugsFromDb } from '../infrastructure/ocr/brandSlugs';

/**
 * Garante schema, seeds e caches em memória.
 * Em ambientes maduros, migrar para ferramenta de migrations.
 */
export async function initDatabase(): Promise<void> {
  await UserRepository.createTable();
  await EstadoRepository.createTable();
  await CalendarioRepository.createTable();
  await ProdutoRepository.createTable();
  await DeParaProdutoEstadoRepository.createTable();
  await PautaFiscalRepository.createTable();
  await TermoRepository.createTable();
  await UfCompactorRepository.createTable();
  await AuditRepository.createTable();
  await TermoRepository.seed();
  await UfCompactorRepository.seed();
  await loadBrandSlugsFromDb();
  await EstadoRepository.seed();
  await CalendarioRepository.seed();

  const usersResult = await UserRepository.getAll();
  if ((usersResult.rowCount || 0) === 0) {
    await UserRepository.create({
      nome: 'Administrador',
      email: 'admin@admin.com',
      senha_hash: 'Admin#1234',
      perfil: 'admin',
    });
    console.log('Default admin user seeded: admin@admin.com / Admin#1234');
  }

  console.log('Database initialized');
}
