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