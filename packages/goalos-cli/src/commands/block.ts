/**
 * block command - Mark a goal as blocked by another goal
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { IntentGraphClass } from '@goalos/core';
import { getGraphPath } from '../config.js';
import { success, error } from '../display.js';
import type { CLIConfig } from '../config.js';

export interface BlockOptions {
  by: string; // Goal ID that blocks this goal
}

export async function handleBlock(
  goalId: string,
  options: BlockOptions,
  config: CLIConfig
): Promise<void> {
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

    // Find goals
    const goal = graph.getGoal(goalId);
    if (!goal) {
      console.log(error(`Goal not found: ${goalId}`));
      process.exit(1);
    }

    const blockerGoal = graph.getGoal(options.by);
    if (!blockerGoal) {
      console.log(error(`Blocker goal not found: ${options.by}`));
      process.exit(1);
    }

    // Mark as blocked
    const blocked = graph.blockGoal(goalId, options.by);

    // Save updated graph
    writeFileSync(graphPath, JSON.stringify(graph.toJSON(), null, 2));

    console.log(success(`Blocked goal: ${blocked.title}`));
    console.log(`  Blocked by: ${blockerGoal.title}`);
  } catch (err) {
    console.log(error(`Failed to block goal: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
