import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import UserRepository from '../repositories/UserRepository';

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

export async function getAll(req: Request, res: Response) {
  try {
    const result = await UserRepository.getAll();
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const result = await UserRepository.findById(req.params.id as string);
    if (!result) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

const TEMP_PASSWORD_PREFIX = 'Tmp#';

function generateRandomPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // Ensure we have at least one character from each required set
  const passwordChars = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    specials[Math.floor(Math.random() * specials.length)]
  ];
  
  const allChars = uppercase + lowercase + numbers + specials;
  // Generate the remaining random characters for a strong password
  for (let i = 0; i < 8; i++) {
    passwordChars.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }
  
  // Shuffle characters to avoid predictable positions
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }
  
  return `${TEMP_PASSWORD_PREFIX}${passwordChars.join('')}`;
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const { name, email, role } = req.body;
    const userRole = req.userRole;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem cadastrar usuários' });
    }

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e e-mail são obrigatórios' });
    }

    // Check if user already exists
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Já existe um usuário cadastrado com este e-mail' });
    }

    const password = generateRandomPassword();

    const result = await UserRepository.create({ name, email, password, role });
    res.status(201).json({
      ...result.rows[0],
      tempPassword: password
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { name, email, role, active, password } = req.body;
    const userRole = req.userRole;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem editar usuários' });
    }

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e e-mail são obrigatórios' });
    }

    // Check if email is already taken by another user
    const existing = await UserRepository.findByEmail(email);
    if (existing && String(existing.id) !== String(id)) {
      return res.status(400).json({ error: 'Este e-mail já está sendo usado por outro usuário' });
    }

    // Update basic fields
    const result = await UserRepository.update(id, { name, email, role, active });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // If password is provided, validate and update it
    if (password && password.trim() !== '') {
      if (!validatePassword(password)) {
        return res.status(400).json({
          error: 'A senha deve ter no mínimo 8 caracteres, pelo menos uma letra maiúscula, um número e um caractere especial.'
        });
      }
      await UserRepository.updatePassword(id, password);
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function resetPassword(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const userRole = req.userRole;

    // Check if current user is an admin
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem resetar a senha de outros usuários' });
    }

    const newPassword = generateRandomPassword();
    await UserRepository.updatePassword(id, newPassword);

    res.json({ tempPassword: newPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const userRole = req.userRole;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem excluir usuários' });
    }

    await UserRepository.delete(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export { remove as delete };
