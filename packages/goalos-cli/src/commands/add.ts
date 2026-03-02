/**
 * add command - Add a new goal
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { IntentGraphClass } from '@goalos/core';
import { getGraphPath } from '../config.js';
import { success, error } from '../display.js';
import type { CLIConfig } from '../config.js';
import type { Priority, TimeHorizon } from '@goalos/core';

export interface AddOptions {
  description?: string;
  parentId?: string;
  priority?: string;
  domain?: string;
  deadline?: string;
  timeHorizon?: string;
  successCriteria?: string;
  motivation?: string;
  tags?: string;
}

export async function handleAdd(
  title: string,
  options: AddOptions,
  config: CLIConfig
): Promise<void> {
  const graphPath = getGraphPath(config);

  // Check if graph exists
  if (!existsSync(graphPath)) {
    console.log(error('Intent graph not found. Run "goalos init" first'));
    process.exit(1);
  }

  try {
    // Load existing graph
    const graphData = readFileSync(graphPath, 'utf-8');
    const graph = IntentGraphClass.fromJSON(JSON.parse(graphData));

    // Parse priority
    const priorityLevel = (options.priority || 'medium') as 'critical' | 'high' | 'medium' | 'low' | 'someday';

    // Parse success criteria
    const successCriteria = options.successCriteria
      ? options.successCriteria.split('|').map((s) => s.trim())
      : undefined;

    // Parse tags
    const tags = options.tags ? options.tags.split(',').map((t) => t.trim()) : undefined;

    // Create priority object
    const priority: Priority = {
      level: priorityLevel,
      reason: undefined
    };

    // Add the goal
    const goal = graph.addGoal({
      title,
      description: options.description,
      parentId: options.parentId,
      priority,
      domain: options.domain || config.defaultDomain,
      deadline: options.deadline,
      timeHorizon: options.timeHorizon as TimeHorizon | undefined,
      successCriteria,
      motivation: options.motivation,
      tags,
      status: 'active'
    });

    // Save updated graph
    writeFileSync(graphPath, JSON.stringify(graph.toJSON(), null, 2));

    console.log(success(`Created goal: ${goal.title}`));
    console.log(`  ID: ${goal.id}`);
    console.log(`  Priority: ${goal.priority.level}`);
    if (goal.deadline) {
      console.log(`  Deadline: ${new Date(goal.deadline).toLocaleDateString()}`);
    }
  } catch (err) {
    console.log(error(`Failed to add goal: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
