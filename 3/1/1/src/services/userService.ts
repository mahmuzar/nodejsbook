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

// ... существующий код ...

export function findUserById(id: number): User | undefined {
  const users = readUsers();
  return users.find(u => u.id === id);
}

export function getAllUsers(): User[] {
  return readUsers();
}