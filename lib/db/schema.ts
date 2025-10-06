import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'uga-bus-tracker.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize database schema
export function initializeDatabase() {
  db.exec(`
    -- User favorites for specific routes between stops
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      from_stop_id TEXT NOT NULL,
      to_stop_id TEXT NOT NULL,
      preferred_routes TEXT, -- JSON array of route IDs
      priority_mode TEXT DEFAULT 'time', -- 'time' or 'occupancy'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User preferences
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Cache for GTFS static data
    CREATE TABLE IF NOT EXISTS gtfs_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key TEXT UNIQUE NOT NULL,
      data TEXT NOT NULL, -- JSON data
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_favorites_stops ON favorites(from_stop_id, to_stop_id);
    CREATE INDEX IF NOT EXISTS idx_gtfs_cache_key ON gtfs_cache(cache_key);
    CREATE INDEX IF NOT EXISTS idx_gtfs_cache_expires ON gtfs_cache(expires_at);
  `);
}

// Initialize on module load
initializeDatabase();

export interface Favorite {
  id?: number;
  name: string;
  from_stop_id: string;
  to_stop_id: string;
  preferred_routes?: string[]; // Will be serialized as JSON
  priority_mode: 'time' | 'occupancy';
  created_at?: string;
  updated_at?: string;
}

export interface UserPreference {
  id?: number;
  key: string;
  value: string;
  updated_at?: string;
}

export interface GTFSCache {
  id?: number;
  cache_key: string;
  data: string; // JSON stringified data
  expires_at: string;
  created_at?: string;
}
