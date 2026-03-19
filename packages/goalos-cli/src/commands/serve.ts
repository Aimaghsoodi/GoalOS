/**
 * serve command - Start the GoalOS MCP server
 */

import { error, info } from '../display.js';
import type { CLIConfig } from '../config.js';

export interface ServeOptions {
  storage?: 'file' | 'sqlite';
}

export async function handleServe(options: ServeOptions, _config: CLIConfig): Promise<void> {
  try {
    // Set storage type via environment variable before importing server
    if (options.storage) {
      process.env.GOALOS_STORAGE = options.storage;
    }

    console.log(info('Starting GoalOS MCP server...'));
    console.log(info(`Storage: ${options.storage || 'file'}`));
    console.log(info('Transport: stdio'));
    console.log('');

    // Dynamic import to avoid loading MCP dependencies unless needed
    const { GoalOSMCPServer } = await import('@goalos/mcp-server');

    const server = new GoalOSMCPServer({
      storage: options.storage || 'file',
    });

    await server.start();
  } catch (err) {
    console.log(error(`Failed to start MCP server: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
