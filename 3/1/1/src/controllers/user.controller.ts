// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { findUserByUsername, findUserById, getAllUsers } from '../services/userService';
import { AuthRequest } from '../types';

// GET /api/me
export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Пользователь не авторизован' });
    return;
  }

  const user = findUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  res.json({
    id: user.id,
    username: user.username
    // ⚠️ Никогда не возвращай password!
  });
}

// GET /api/users (только для демонстрации!)
export async function getUsers(_req: Request, res: Response): Promise<void> {
  const users = getAllUsers().map(u => ({
    id: u.id,
    username: u.username
  }));
  res.json(users);
}