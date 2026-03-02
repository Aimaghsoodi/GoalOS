#!/usr/bin/env node
/**
 * GoalOS MCP Server Entry Point
 * Starts the MCP server with stdio transport
 */

import { GoalOSMCPServer } from './server.js';

async function main(): Promise<void> {
  try {
    const server = new GoalOSMCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start GoalOS MCP server:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();

// Re-export for programmatic use
export { GoalOSMCPServer } from './server.js';
export { handleToolCall } from './handlers.js';
export type { IStorage } from './storage.js';
export { FileStorage } from './storage-file.js';
export { SQLiteStorage } from './storage-sqlite.js';
export { loadConfig } from './config.js';
export type { MCPServerConfig } from './config.js';
