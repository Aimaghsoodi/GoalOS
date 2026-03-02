/**
 * Storage interface for intent graphs
 */

import type { IntentGraph } from '@goalos/core';

export interface IStorage {
  /**
   * Load the intent graph from storage
   */
  load(): Promise<IntentGraph>;

  /**
   * Save the intent graph to storage
   */
  save(graph: IntentGraph): Promise<void>;

  /**
   * Initialize storage (create directories, tables, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Check if storage is initialized
   */
  isInitialized(): Promise<boolean>;

  /**
   * Get storage path/location info for logging
   */
  getInfo(): string;
}

export class StorageError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'StorageError';
  }
}
