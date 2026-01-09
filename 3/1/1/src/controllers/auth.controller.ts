import { Request, Response } from 'express';
import {
  registerUser,
  findUserByUsername,
  comparePassword,
  generateToken
} from '../services/userService';

export async function register(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Требуются username и password' });
    return;
  }

  try {
    const user = await registerUser(username, password);
    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err: any) {
    if (err.message === 'USER_EXISTS') {
      res.status(409).json({ error: 'Пользователь уже существует' });
      return;
    }
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Требуются username и password' });
    return;
  }

  const user = findUserByUsername(username);
  if (!user) {
    res.status(401).json({ error: 'Неверные учётные данные' });
    return;
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    res.status(401).json({ error: 'Неверные учётные данные' });
    return;
  }

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username }
  });
}