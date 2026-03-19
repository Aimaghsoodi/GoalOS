/**
 * init command - Create a new intent graph
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { IntentGraphClass } from '@goalos/core';
import { getGraphPath, getGraphDir } from '../config.js';
import { success, error, info } from '../display.js';
import type { CLIConfig } from '../config.js';

export async function handleInit(config: CLIConfig): Promise<void> {
  const graphPath = getGraphPath(config);
  const graphDir = getGraphDir(config);

  // Check if graph already exists
  if (existsSync(graphPath)) {
    console.log(error('Intent graph already exists at ' + graphPath));
    console.log(info('Use "goalos import <file>" to import another graph'));
    process.exit(1);
  }

  try {
    // Create graph directory
    if (!existsSync(graphDir)) {
      mkdirSync(graphDir, { recursive: true });
    }

    // Create new intent graph
    const graph = IntentGraphClass.create(process.env.USER || 'default_user', 'My Goals');
    const graphData = graph.toJSON();

    // Save to file
    writeFileSync(graphPath, JSON.stringify(graphData, null, 2));

    console.log(success(`Created new intent graph at ${graphPath}`));
    console.log(info('Start adding goals with "goalos add <title>"'));
  } catch (err) {
    console.log(error(`Failed to initialize graph: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
