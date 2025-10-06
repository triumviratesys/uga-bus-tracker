import { db, Favorite, UserPreference, GTFSCache } from './schema';

// Favorites CRUD operations
export const favoriteQueries = {
  getAll(): Favorite[] {
    const stmt = db.prepare('SELECT * FROM favorites ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      ...row,
      preferred_routes: row.preferred_routes ? JSON.parse(row.preferred_routes) : []
    }));
  },

  getById(id: number): Favorite | undefined {
    const stmt = db.prepare('SELECT * FROM favorites WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      preferred_routes: row.preferred_routes ? JSON.parse(row.preferred_routes) : []
    };
  },

  create(favorite: Omit<Favorite, 'id' | 'created_at' | 'updated_at'>): number {
    const stmt = db.prepare(`
      INSERT INTO favorites (name, from_stop_id, to_stop_id, preferred_routes, priority_mode)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      favorite.name,
      favorite.from_stop_id,
      favorite.to_stop_id,
      favorite.preferred_routes ? JSON.stringify(favorite.preferred_routes) : null,
      favorite.priority_mode
    );
    return info.lastInsertRowid as number;
  },

  update(id: number, favorite: Partial<Favorite>): void {
    const updates: string[] = [];
    const params: any[] = [];

    if (favorite.name !== undefined) {
      updates.push('name = ?');
      params.push(favorite.name);
    }
    if (favorite.from_stop_id !== undefined) {
      updates.push('from_stop_id = ?');
      params.push(favorite.from_stop_id);
    }
    if (favorite.to_stop_id !== undefined) {
      updates.push('to_stop_id = ?');
      params.push(favorite.to_stop_id);
    }
    if (favorite.preferred_routes !== undefined) {
      updates.push('preferred_routes = ?');
      params.push(JSON.stringify(favorite.preferred_routes));
    }
    if (favorite.priority_mode !== undefined) {
      updates.push('priority_mode = ?');
      params.push(favorite.priority_mode);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(`UPDATE favorites SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);
  },

  delete(id: number): void {
    const stmt = db.prepare('DELETE FROM favorites WHERE id = ?');
    stmt.run(id);
  }
};

// User preferences operations
export const preferenceQueries = {
  get(key: string): string | undefined {
    const stmt = db.prepare('SELECT value FROM user_preferences WHERE key = ?');
    const row = stmt.get(key) as any;
    return row?.value;
  },

  set(key: string, value: string): void {
    const stmt = db.prepare(`
      INSERT INTO user_preferences (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(key, value, value);
  },

  delete(key: string): void {
    const stmt = db.prepare('DELETE FROM user_preferences WHERE key = ?');
    stmt.run(key);
  }
};

// GTFS cache operations
export const cacheQueries = {
  get(cacheKey: string): any | undefined {
    const stmt = db.prepare(`
      SELECT data FROM gtfs_cache
      WHERE cache_key = ? AND expires_at > datetime('now')
    `);
    const row = stmt.get(cacheKey) as any;
    if (!row) return undefined;
    return JSON.parse(row.data);
  },

  set(cacheKey: string, data: any, ttlSeconds: number): void {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const stmt = db.prepare(`
      INSERT INTO gtfs_cache (cache_key, data, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET
        data = ?,
        expires_at = ?,
        created_at = CURRENT_TIMESTAMP
    `);
    const dataStr = JSON.stringify(data);
    stmt.run(cacheKey, dataStr, expiresAt, dataStr, expiresAt);
  },

  delete(cacheKey: string): void {
    const stmt = db.prepare('DELETE FROM gtfs_cache WHERE cache_key = ?');
    stmt.run(cacheKey);
  },

  clearExpired(): void {
    const stmt = db.prepare(`DELETE FROM gtfs_cache WHERE expires_at <= datetime('now')`);
    stmt.run();
  }
};
