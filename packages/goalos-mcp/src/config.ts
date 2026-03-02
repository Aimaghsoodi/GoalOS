/**
 * GoalOS MCP Server Configuration
 */

import { homedir } from 'os';
import { join } from 'path';

export type StorageType = 'file' | 'sqlite';

export interface MCPServerConfig {
  storage: StorageType;
  storageDir: string;
  storageFile: string;
  dbFile: string;
  owner: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Load server configuration from environment variables or defaults
 */
export function loadConfig(): MCPServerConfig {
  const storageDir = process.env.GOALOS_STORAGE_DIR || join(homedir(), '.goalos');
  const storage = (process.env.GOALOS_STORAGE || 'file') as StorageType;
  const owner = process.env.GOALOS_OWNER || 'default-owner';
  const logLevel = (process.env.GOALOS_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error';

  return {
    storage,
    storageDir,
    storageFile: join(storageDir, 'graph.json'),
    dbFile: join(storageDir, 'goalos.db'),
    owner,
    logLevel
  };
}
