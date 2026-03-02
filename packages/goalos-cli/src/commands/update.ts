/**
 * update command - Update a goal's properties
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { IntentGraphClass } from '@goalos/core';
import { getGraphPath } from '../config.js';
import { success, error } from '../display.js';
import type { CLIConfig } from '../config.js';
import type { Priority } from '@goalos/core';

export interface UpdateOptions {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  deadline?: string;
  domain?: string;
  motivation?: string;
  tags?: string;
}

export async function handleUpdate(
  goalId: string,
  options: UpdateOptions,
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

    // Prepare updates
    const updates: any = {};

    if (options.title) updates.title = options.title;
    if (options.description) updates.description = options.description;
    if (options.priority) {
      updates.priority = {
        ...goal.priority,
        level: options.priority
      } as Priority;
    }
    if (options.status) updates.status = options.status;
    if (options.deadline) updates.deadline = options.deadline;
    if (options.domain) updates.domain = options.domain;
    if (options.motivation) updates.motivation = options.motivation;
    if (options.tags) {
      updates.tags = options.tags.split(',').map((t) => t.trim());
    }

    // Update goal
    const updated = graph.updateGoal(goalId, updates);

    // Save updated graph
    writeFileSync(graphPath, JSON.stringify(graph.toJSON(), null, 2));

    console.log(success(`Updated goal: ${updated.title}`));
    Object.keys(options).forEach((key) => {
      console.log(`  ${key}: ${(options as any)[key]}`);
    });
  } catch (err) {
    console.log(error(`Failed to update goal: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
