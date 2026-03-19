/**
 * status command - Display dashboard with key metrics
 */

import { existsSync, readFileSync } from 'fs';
import { IntentGraphClass, isOverdue } from '@goalos/core';
import { getGraphPath } from '../config.js';
import { createDashboard, error } from '../display.js';
import type { CLIConfig } from '../config.js';

export async function handleStatus(config: CLIConfig): Promise<void> {
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

    // Get metrics
    const stats = graph.getStats();
    const activeGoals = graph.getByStatus('active');
    const topPriorities = graph.getTopPriorities(5);
    const allGoals = graph.query({});
    const overdue = allGoals.filter((g) => isOverdue(g));
    const blocked = graph.getByStatus('blocked');
    const completionRate = stats.completionRate;

    // Display dashboard
    const dashboard = createDashboard(
      activeGoals.length,
      topPriorities,
      overdue,
      blocked,
      completionRate
    );

    console.log(dashboard);
  } catch (err) {
    console.log(error(`Failed to show status: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
