/**
 * list command - Display goals in various formats
 */

import { existsSync, readFileSync } from 'fs';
import { IntentGraphClass } from '@goalos/core';
import { getGraphPath } from '../config.js';
import { renderTree, createGoalTable, error } from '../display.js';
import type { CLIConfig } from '../config.js';
import type { GoalStatus, PriorityLevel } from '@goalos/core';

export interface ListOptions {
  format?: 'tree' | 'table' | 'json';
  status?: string;
  priority?: string;
  domain?: string;
  tags?: string;
  completed?: boolean;
}

export async function handleList(options: ListOptions, config: CLIConfig): Promise<void> {
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

    // Apply filters
    const statusFilter = options.status ? (options.status.split(',') as GoalStatus[]) : undefined;
    const priorityFilter = options.priority ? (options.priority.split(',') as PriorityLevel[]) : undefined;
    const domainFilter = options.domain ? options.domain.split(',') : undefined;
    const tagsFilter = options.tags ? options.tags.split(',').map((t) => t.trim()) : undefined;

    const filteredGoals = graph.query({
      status: statusFilter,
      priority: priorityFilter,
      domain: domainFilter,
      tags: tagsFilter
    });

    const format = options.format || config.defaultFormat || 'tree';

    if (format === 'tree') {
      const tree = graph.getTree();
      const filtered = tree
        .map((node) => filterTree(node, filteredGoals))
        .filter((node) => node !== null);
      console.log(renderTree(filtered as any));
    } else if (format === 'table') {
      const table = createGoalTable(filteredGoals);
      console.log(table.toString());
    } else if (format === 'json') {
      console.log(JSON.stringify(filteredGoals, null, 2));
    }

    console.log(`\nTotal: ${filteredGoals.length} goals`);
  } catch (err) {
    console.log(error(`Failed to list goals: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}

/**
 * Filter tree nodes based on goal IDs
 */
function filterTree(node: any, goals: any[]): any | null {
  const goalIds = new Set(goals.map((g) => g.id));

  if (goalIds.has(node.goal.id)) {
    const children = node.children
      .map((child: any) => filterTree(child, goals))
      .filter((child: any) => child !== null);
    return { ...node, children };
  }

  // Check if any children match
  for (const child of node.children) {
    const result = filterTree(child, goals);
    if (result !== null) {
      return { ...node, children: [result] };
    }
  }

  return null;
}
