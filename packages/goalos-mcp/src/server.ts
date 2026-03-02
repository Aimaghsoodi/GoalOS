/**
 * GoalOS MCP Server
 * Sets up the MCP server with tool handlers and stdio transport
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { tools } from './tools.js';
import { handleToolCall } from './handlers.js';
import { loadConfig } from './config.js';
import { FileStorage } from './storage-file.js';
import { SQLiteStorage } from './storage-sqlite.js';
import type { IStorage } from './storage.js';
import type { MCPServerConfig } from './config.js';

export class GoalOSMCPServer {
  private server: Server;
  private storage: IStorage;
  private config: MCPServerConfig;

  constructor(config?: Partial<MCPServerConfig>) {
    this.config = { ...loadConfig(), ...config };

    // Initialize storage based on config
    if (this.config.storage === 'sqlite') {
      this.storage = new SQLiteStorage(this.config.dbFile);
    } else {
      this.storage = new FileStorage(this.config.storageFile);
    }

    // Create MCP server
    this.server = new Server(
      {
        name: 'goalos',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.registerHandlers();
  }

  /**
   * Register MCP request handlers for listing and calling tools
   */
  private registerHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await handleToolCall(name, args ?? {}, this.storage);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ error: message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Start the MCP server with stdio transport
   */
  async start(): Promise<void> {
    // Initialize storage
    const initialized = await this.storage.isInitialized();
    if (!initialized) {
      await this.storage.initialize();
    }

    // Connect via stdio transport
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Log to stderr so we don't interfere with stdio protocol
    console.error(`GoalOS MCP Server v0.1.0 started`);
    console.error(`Storage: ${this.storage.getInfo()}`);
  }
}
