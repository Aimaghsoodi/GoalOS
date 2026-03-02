/**
 * complete command - Mark a goal as completed
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { IntentGraphClass } from '@goalos/core';
import { getGraphPath } from '../config.js';
import { success, error } from '../display.js';
import type { CLIConfig } from '../config.js';

export interface CompleteOptions {
  notes?: string;
}

export async function handleComplete(
  goalId: string,
  options: CompleteOptions,
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

    // Find goal
    const goal = graph.getGoal(goalId);
    if (!goal) {
      console.log(error(`Goal not found: ${goalId}`));
      process.exit(1);
    }

    // Mark as completed
    const completed = graph.completeGoal(goalId, process.env.USER || 'cli');

    // Save updated graph
    writeFileSync(graphPath, JSON.stringify(graph.toJSON(), null, 2));

    console.log(success(`Completed goal: ${completed.title}`));
    if (options.notes) {
      console.log(`  Notes: ${options.notes}`);
    }
  } catch (err) {
    console.log(error(`Failed to complete goal: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
