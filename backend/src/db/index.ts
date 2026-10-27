import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import Database from 'better-sqlite3';
import { config } from '../config/env';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

class DatabaseManager {
  private pgPool: Pool | null = null;
  private sqliteDb: Database.Database | null = null;
  public isPostgres: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    if (config.databaseUrl && config.databaseUrl.startsWith('postgres')) {
      try {
        this.pgPool = new Pool({
          connectionString: config.databaseUrl,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        this.isPostgres = true;
        console.log('[Database] Connecting to PostgreSQL at', config.databaseUrl.split('@')[1] || 'localhost');
      } catch (err) {
        console.warn('[Database] PostgreSQL connection failed, switching to SQLite fallback:', err);
        this.initSqlite();
      }
    } else {
      this.initSqlite();
    }
  }

  private initSqlite() {
    const dbDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, 'timeweave.db');
    this.sqliteDb = new Database(dbPath);
    this.sqliteDb.pragma('journal_mode = WAL');
    this.sqliteDb.pragma('foreign_keys = ON');
    this.isPostgres = false;
    console.log('[Database] Using embedded SQLite engine at:', dbPath);
  }

  public async runMigrations() {
    const migrationFile = path.resolve(__dirname, '../migrations/001_initial_schema.sql');
    if (!fs.existsSync(migrationFile)) {
      console.error('[Database] Migration file not found:', migrationFile);
      return;
    }
    const sql = fs.readFileSync(migrationFile, 'utf8');

    if (this.isPostgres && this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query(sql);
        console.log('[Database] PostgreSQL migrations executed successfully.');
      } finally {
        client.release();
      }
    } else if (this.sqliteDb) {
      // Split statements for SQLite execution
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      this.sqliteDb.transaction(() => {
        for (const stmt of statements) {
          try {
            this.sqliteDb!.exec(stmt);
          } catch (e: any) {
            // Ignore if index or table already exists
            if (!e.message.includes('already exists')) {
              console.warn('[Database Migration Notice]:', e.message);
            }
          }
        }
      })();
      console.log('[Database] SQLite migrations executed successfully.');
    }
  }

  public async query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    if (this.isPostgres && this.pgPool) {
      const res = await this.pgPool.query(text, params);
      return {
        rows: res.rows,
        rowCount: res.rowCount || 0
      };
    } else if (this.sqliteDb) {
      // Convert PostgreSQL $1, $2 placeholders to SQLite ? placeholders
      const sqliteSql = text.replace(/\$(\d+)/g, '?');
      const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sqliteSql);

      // Normalize parameters (e.g. booleans to 1/0, JSON objects to strings)
      const normalizedParams = params.map(p => {
        if (typeof p === 'boolean') return p ? 1 : 0;
        if (p !== null && typeof p === 'object' && !(p instanceof Date)) {
          return JSON.stringify(p);
        }
        return p;
      });

      if (isSelect) {
        const stmt = this.sqliteDb.prepare(sqliteSql);
        const rows = stmt.all(...normalizedParams) as T[];
        return {
          rows,
          rowCount: rows.length
        };
      } else {
        const stmt = this.sqliteDb.prepare(sqliteSql);
        const info = stmt.run(...normalizedParams);
        return {
          rows: [],
          rowCount: info.changes
        };
      }
    }

    throw new Error('Database not initialized');
  }

  public async close() {
    if (this.pgPool) await this.pgPool.end();
    if (this.sqliteDb) this.sqliteDb.close();
  }
}

export const db = new DatabaseManager();
