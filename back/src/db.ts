import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(__dirname, "..", "data.db");

const db: DatabaseType = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS crise_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    duration REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS drug_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS flash_pop_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mrt REAL NOT NULL,
    inhibition_rate REAL NOT NULL,
    iiv_score REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS noise_game_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vocal_initention_latence REAL NOT NULL,
    motrice_planification REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export default db;
