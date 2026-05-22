import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import dotenv from 'dotenv';
import UserRepository from '../repositories/UserRepository';
import { AuthRequest } from '../middleware/authMiddleware';

dotenv.config({ path: path.join(__dirname, '../../.env') });

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}
const JWT_SECRET = process.env.JWT_SECRET!;

const JWT_EXPIRES_IN = '7d';
const TEMP_PASSWORD_PREFIX = 'Tmp#';

function isTemporaryPassword(password: string): boolean {
  return typeof password === 'string' && password.startsWith(TEMP_PASSWORD_PREFIX);
}

// Password complexity validation: minimum 8 characters, at least 1 uppercase letter, at least 1 number, at least 1 special character
function validatePassword(password: string): boolean {
  if (!password || password.length < 8) return false;

  // At least one uppercase letter
  const hasUppercase = /[A-Z]/.test(password);
  if (!hasUppercase) return false;

  // At least one number
  const hasNumber = /[0-9]/.test(password);
  if (!hasNumber) return false;

  // Common special characters
  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\/~`\\|';]/;
  return specialCharRegex.test(password);
}

function mapFromDb(dbRow: any): any {
  if (!dbRow) return null;
  return {
    id: dbRow.sk_usuario,
    name: dbRow.nome,
    email: dbRow.email,
    role: dbRow.perfil,
    active: dbRow.ativo,
    created_at: dbRow.created_at,
  };
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!user.ativo) {
      return res.status(403).json({ error: 'Usuário desativado. Contate o administrador.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.senha_hash!);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const forcePasswordChange = isTemporaryPassword(password);

    const token = jwt.sign(
      { id: user.sk_usuario, email: user.email, role: user.perfil },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      forcePasswordChange,
      user: mapFromDb(user),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    const user = await UserRepository.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(mapFromDb(user));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getAll(req: Request, res: Response) {
  try {
    const result = await UserRepository.getAll();
    res.json(result.rows.map(mapFromDb));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { name, email, password, role } = req.body;
    const result = await UserRepository.create({ nome: name, email, senha_hash: password, perfil: role });
    res.status(201).json(mapFromDb(result.rows[0]));
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const result = await UserRepository.update(req.params.id as string, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(mapFromDb(result.rows[0]));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        error: 'A nova senha deve ter no mínimo 8 caracteres, pelo menos uma letra maiúscula, um número e um caractere especial.'
      });
    }

    const user = await UserRepository.findByIdWithPassword(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.senha_hash!);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    await UserRepository.updatePassword(userId, newPassword);
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await UserRepository.delete(req.params.id as string);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export { remove as delete };
