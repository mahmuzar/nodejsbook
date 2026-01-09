// src/routes/user.routes.ts
import { Router } from 'express';
import { getProfile, getUsers } from '../controllers/user.controller';

const router = Router();

router.get('/me', getProfile);      // текущий пользователь
router.get('/users', getUsers);     // список всех (только для демо!)

export default router;