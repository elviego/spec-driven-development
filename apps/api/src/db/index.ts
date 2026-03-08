import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { setupSchema } from './schema';

const dbPath = process.env.DB_PATH || './data/sdd.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

setupSchema(db);

export default db;
