/**
 * SQLite-based storage implementation for intent graphs
 * Provides structured storage with better query capabilities
 */

import Database from 'better-sqlite3';
import { dirname } from 'path';
import { mkdirSync } from 'fs';
import type { IntentGraph } from '@goalos/core';
import { IntentGraphClass } from '@goalos/core';
import { IStorage, StorageError } from './storage.js';

export class SQLiteStorage implements IStorage {
  private db?: Database.Database;

  constructor(private dbPath: string) {}

  private getDb(): Database.Database {
    if (!this.db) {
      throw new StorageError('Database not initialized. Call initialize() first.', 'NOT_INITIALIZED');
    }
    return this.db;
  }

  async initialize(): Promise<void> {
    try {
      const dir = dirname(this.dbPath);
      mkdirSync(dir, { recursive: true });

      this.db = new Database(this.dbPath);

      // Create tables
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS intent_graphs (
          id TEXT PRIMARY KEY,
          version TEXT NOT NULL,
          owner TEXT NOT NULL,
          name TEXT,
          description TEXT,
          data TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          metadata TEXT
        );

        CREATE TABLE IF NOT EXISTS goals (
          id TEXT PRIMARY KEY,
          graphId TEXT NOT NULL,
          title TEXT NOT NULL,
          status TEXT NOT NULL,
          priority TEXT NOT NULL,
          parentId TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (graphId) REFERENCES intent_graphs(id)
        );

        CREATE INDEX IF NOT EXISTS idx_goals_graphId ON goals(graphId);
        CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
        CREATE INDEX IF NOT EXISTS idx_goals_parentId ON goals(parentId);
      `);
    } catch (error) {
      throw new StorageError(
        `Failed to initialize SQLite storage: ${error instanceof Error ? error.message : String(error)}`,
        'INIT_ERROR'
      );
    }
  }

  async isInitialized(): Promise<boolean> {
    try {
      if (!this.db) {
        this.db = new Database(this.dbPath, { readonly: true });
      }
      // Try a simple query to verify the database works
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }

  async load(): Promise<IntentGraph> {
    try {
      const db = this.getDb();
      const row = db.prepare('SELECT data FROM intent_graphs LIMIT 1').get() as any;

      if (!row) {
        throw new StorageError('No intent graph found in database', 'NOT_FOUND');
      }

      const graphData = JSON.parse(row.data);
      const graph = IntentGraphClass.fromJSON(graphData);
      return graph.toJSON() as IntentGraph;
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `Failed to load intent graph: ${error instanceof Error ? error.message : String(error)}`,
        'LOAD_ERROR'
      );
    }
  }

  async save(graph: IntentGraph): Promise<void> {
    try {
      const db = this.getDb();
      const data = JSON.stringify(graph);

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO intent_graphs
        (id, version, owner, name, description, data, createdAt, updatedAt, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        graph.id,
        graph.version,
        graph.owner,
        graph.name || null,
        graph.description || null,
        data,
        graph.createdAt,
        graph.updatedAt,
        graph.metadata ? JSON.stringify(graph.metadata) : null
      );

      // Store goals for indexed access
      const goalStmt = db.prepare(`
        INSERT OR REPLACE INTO goals
        (id, graphId, title, status, priority, parentId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const goal of graph.goals) {
        goalStmt.run(
          goal.id,
          graph.id,
          goal.title,
          goal.status,
          JSON.stringify(goal.priority),
          goal.parentId || null,
          goal.createdAt,
          goal.updatedAt
        );
      }
    } catch (error) {
      throw new StorageError(
        `Failed to save intent graph: ${error instanceof Error ? error.message : String(error)}`,
        'SAVE_ERROR'
      );
    }
  }

  getInfo(): string {
    return `SQLite Database: ${this.dbPath}`;
  }
}
