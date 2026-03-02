/**
 * File-based storage implementation for intent graphs
 * Stores IntentGraph as JSON at ~/.goalos/graph.json
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';
import type { IntentGraph } from '@goalos/core';
import { IntentGraphClass } from '@goalos/core';
import { IStorage, StorageError } from './storage.js';

export class FileStorage implements IStorage {
  constructor(private filePath: string) {}

  async load(): Promise<IntentGraph> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const data = JSON.parse(content);
      const graph = IntentGraphClass.fromJSON(data);
      return graph.toJSON() as IntentGraph;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new StorageError(
          `Intent graph file not found at ${this.filePath}. Run 'goalos init' to create one.`,
          'ENOENT'
        );
      }
      throw new StorageError(
        `Failed to load intent graph: ${error instanceof Error ? error.message : String(error)}`,
        'LOAD_ERROR'
      );
    }
  }

  async save(graph: IntentGraph): Promise<void> {
    try {
      const dir = dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      const content = JSON.stringify(graph, null, 2);
      await fs.writeFile(this.filePath, content, 'utf-8');
    } catch (error) {
      throw new StorageError(
        `Failed to save intent graph: ${error instanceof Error ? error.message : String(error)}`,
        'SAVE_ERROR'
      );
    }
  }

  async initialize(): Promise<void> {
    try {
      const isInitialized = await this.isInitialized();
      if (!isInitialized) {
        const dir = dirname(this.filePath);
        await fs.mkdir(dir, { recursive: true });

        // Create an empty intent graph
        const emptyGraph: IntentGraph = {
          id: `graph_${Date.now()}`,
          version: '0.1.0',
          owner: 'default-owner',
          goals: [],
          defaultPermissions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await this.save(emptyGraph);
      }
    } catch (error) {
      throw new StorageError(
        `Failed to initialize storage: ${error instanceof Error ? error.message : String(error)}`,
        'INIT_ERROR'
      );
    }
  }

  async isInitialized(): Promise<boolean> {
    try {
      await fs.access(this.filePath);
      return true;
    } catch {
      return false;
    }
  }

  getInfo(): string {
    return `File: ${this.filePath}`;
  }
}
