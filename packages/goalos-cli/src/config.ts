/**
 * CLI Configuration Management
 * Handles loading and managing CLI settings from ~/.goalos/config.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';

export interface CLIConfig {
  /** Default file path for intent graph storage */
  graphPath?: string;
  /** Default output format */
  defaultFormat?: 'tree' | 'table' | 'json';
  /** Default domain for filtering */
  defaultDomain?: string;
  /** Automatically open browser for visualizations */
  autoBrowser?: boolean;
  /** Color output enabled */
  colorOutput?: boolean;
  /** Default time horizon for new goals */
  defaultTimeHorizon?: string;
}

const CONFIG_DIR = join(homedir(), '.goalos');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const DEFAULT_GRAPH_PATH = join(CONFIG_DIR, 'graph.json');

/**
 * Load configuration from user's home directory
 */
export function loadConfig(): CLIConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      const data = readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Failed to load config file, using defaults');
  }

  return getDefaultConfig();
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): CLIConfig {
  return {
    graphPath: DEFAULT_GRAPH_PATH,
    defaultFormat: 'tree',
    colorOutput: true,
    autoBrowser: false,
    defaultDomain: 'personal'
  };
}

/**
 * Save configuration to user's home directory
 */
export function saveConfig(config: CLIConfig): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(`Failed to save config: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get the path to the intent graph file
 */
export function getGraphPath(config: CLIConfig): string {
  return config.graphPath || DEFAULT_GRAPH_PATH;
}

/**
 * Get the directory containing the graph file
 */
export function getGraphDir(config: CLIConfig): string {
  return dirname(getGraphPath(config));
}
