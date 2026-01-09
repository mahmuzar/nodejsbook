Переводим наш микросервис на TypeScript — это повысит надёжность, упростит рефакторинг и приблизит архитектуру к enterprise-подходу (в духе Spring Boot).
____

## ✅ Цели перевода на TypeScript:

- Статическая типизация
- Чёткие интерфейсы для DTO, моделей, сервисов
- Лучшая поддержка IDE (автодополнение, рефакторинг)
- Подготовка к масштабированию

## Содержание

1. [Cтруктура проекта](#-Cтруктура-проекта)
3. [Установка зависимостей](#Установка-зависимостей)
4. [tsconfig.json](#tsconfig.json)
5. [Типы и модели](#Типы-и-модели)
6. [Конфигурация](#Конфигурация)
7. [Утилиты](#Утилиты)
8. [Сервис](#Сервис)
9. [Middleware](#Middleware)
10. [Контроллеры](#Контроллеры)
11. [Роуты](#Роуты)
12. [Приложение и сервер](#Приложение-и-сервер)
13. [Запуск](#Запуск)
14. [Преимущества](#-Преимущества)
15. [Что дальше?](#-Что-дальше)

## [↑](#Содержание) 📁 Cтруктура проекта

auth-user-service/
```csv
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   └── index.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── user.routes.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   │
│   ├── services/
│   │   └── userService.ts
│   │
│   ├── models/
│   │   └── User.ts
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   └── fileDb.ts
│   │
│   └── types/
│       └── index.ts          // глобальные или общие типы
│
├── data/                      // (не в src) — для users.json
│   └── users.json
│
├── .env
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## [↑](#Содержание) Установка зависимостей

```bash
npm init -y

# Основные зависимости
npm install express bcryptjs jsonwebtoken express-rate-limit morgan dotenv

# Типы для TypeScript
npm install -D typescript ts-node @types/node @types/express

# Типы для библиотек
npm install -D @types/bcryptjs @types/jsonwebtoken
```

> 💡 ts-node позволяет запускать .ts файлы без предварительной компиляции.

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Типы и модели
src/models/User.ts

```ts
export interface User {
  id: number;
  username: string;
  password: string; // хеш
}
```

src/types/index.ts

```ts
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface JwtPayload {
  id: number;
  username: string;
  iat: number;
  exp: number;
}
```

## Конфигурация

src/config/index.ts
```ts
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
  dbPath: process.env.DB_PATH || './data/users.json'
};
```

## Утилиты

src/utils/fileDb.ts

```ts
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { User } from '../models/User';

const DB_FILE = path.resolve(config.dbPath);

function ensureDbExists(): void {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, '[]');
  }
}

export function readUsers(): User[] {
  ensureDbExists();
  const data = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(data || '[]') as User[];
}

export function writeUsers(users: User[]): void {
  ensureDbExists();
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}
```

## Сервис

src/services/userService.ts

```ts
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models/User';
import { readUsers, writeUsers } from '../utils/fileDb';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export function generateToken(user: Pick<User, 'id' | 'username'>): string {
  return jwt.sign(
    { id: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: '1h' }
  );
}

export async function registerUser(username: string, password: string): Promise<User> {
  const users = readUsers();
  if (users.some(u => u.username === username)) {
    throw new Error('USER_EXISTS');
  }
  const hashedPassword = await hashPassword(password);
  const newUser: User = {
    id: Date.now(),
    username,
    password: hashedPassword
  };
  users.push(newUser);
  writeUsers(users);
  return newUser;
}

export function findUserByUsername(username: string): User | undefined {
  const users = readUsers();
  return users.find(u => u.username === username);
}
```

## Middleware
src/middlewares/auth.middleware.ts

```ts
import { NextFunction, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthRequest, JwtPayload } from '../types';

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Токен отсутствует' });
    return;
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Неверный или просроченный токен' });
      return;
    }
    req.user = decoded as JwtPayload;
    next();
  });
}
```

## Контроллеры
src/controllers/auth.controller.ts

```ts
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
```

## Роуты
src/routes/auth.routes.ts

```ts
import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);

export default router;
```

## Приложение и сервер
src/app.ts

```ts
import express, { Application } from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { config } from './config';
import { authenticateToken } from './middlewares/auth.middleware';

const app: Application = express();

app.use(express.json());
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Слишком много запросов с этого IP' }
});
app.use(limiter);

// Роуты
app.use('/auth', authRoutes);
app.use('/api', authenticateToken, userRoutes); // все /api — защищены

app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

export default app;
```

src/server.ts

```ts
import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`🔐 Auth microservice запущен на порту ${config.port}`);
});
```

## 11. [Запуск](#11)

Добавь в package.json:

```ts
{
  "scripts": {
    "dev": "ts-node src/server.ts",
    "start": "node dist/server.js",
    "build": "tsc"
  }
}
```

Запуск в режиме разработки:

```bash
npm run dev
```

## ✅ Преимущества

- Полная типобезопасность от контроллера до сервиса
- Автоматическое обнаружение ошибок на этапе написания кода
- Легко интегрировать Prisma, TypeORM или NestJS в будущем
- Подходит для командной разработки и CI/CD

## 🔜 Что дальше?

Микросервис готов к масштабированию и улучщению
____

- Добавить валидацию с Zod или express-validator + TypeScript?
- Перейти от fileDb к PostgreSQL + Prisma?
- Написать Dockerfile и docker-compose.yml? Если разуернут kubernetes то сразу туда в связке с jenkins
- Реализовать refresh tokens?
- Перевести всё в NestJS (если хочешь ещё больше Spring-like)?