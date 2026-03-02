/**
 * tree command - Display full goal hierarchy with all relationships
 */

import { existsSync, readFileSync } from 'fs';
import { IntentGraphClass } from '@goalos/core';
import { getGraphPath } from '../config.js';
import { renderTree, error, dim } from '../display.js';
import type { CLIConfig } from '../config.js';

export interface TreeOptions {
  maxDepth?: number;
  goalId?: string; // Show subtree for specific goal
}

export async function handleTree(options: TreeOptions, config: CLIConfig): Promise<void> {
  const graphPath = getGraphPath(config);

  // Check if graph exists
  if (!existsSync(graphPath)) {
    console.log(error('Intent graph not found. Run "goalos init" first'));
    process.exit(1);
  }

  try {
    // Load graph
    const graphData = readFileSync(graphPath, 'utf-8');
    const graph = IntentGraphClass.fromJSON(JSON.parse(graphData));

    // Get tree
    let tree;
    if (options.goalId) {
      const subtree = graph.getSubtree(options.goalId);
      tree = [subtree];
    } else {
      tree = graph.getTree();
    }

    // Render
    const output = renderTree(tree, options.maxDepth);
    console.log(output);

    // Stats
    const stats = graph.getStats();
    console.log('');
    console.log(dim(`Total: ${stats.totalGoals} goals`));
    console.log(
      dim(`Active: ${stats.byStatus.active}, Completed: ${stats.byStatus.completed}, Blocked: ${stats.byStatus.blocked}`)
    );
  } catch (err) {
    console.log(error(`Failed to show tree: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
