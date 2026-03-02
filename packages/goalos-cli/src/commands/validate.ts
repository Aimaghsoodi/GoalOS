/**
 * validate command - Validate the intent graph
 */

import { existsSync, readFileSync } from 'fs';
import { IntentGraphClass } from '@goalos/core';
import { getGraphPath } from '../config.js';
import { success, error, warning } from '../display.js';
import type { CLIConfig } from '../config.js';

export async function handleValidate(config: CLIConfig): Promise<void> {
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

    // Validate
    const result = graph.validate();

    if (result.valid) {
      console.log(success('Intent graph is valid'));
    } else {
      console.log(error('Intent graph has errors:'));
      result.errors.forEach((err) => {
        console.log(`  - ${err.message}${err.path ? ` (${err.path})` : ''}`);
      });
      process.exit(1);
    }

    // Show warnings
    if (result.warnings.length > 0) {
      console.log(warning(`${result.warnings.length} warning(s):`));
      result.warnings.forEach((warn) => {
        console.log(`  - ${warn.message}${warn.path ? ` (${warn.path})` : ''}`);
      });
    }

    // Show stats
    const stats = graph.getStats();
    console.log('');
    console.log('Statistics:');
    console.log(`  Total goals: ${stats.totalGoals}`);
    console.log(`  Completion rate: ${(stats.completionRate * 100).toFixed(1)}%`);
    console.log(`  Average depth: ${stats.averageDepth.toFixed(1)}`);
    console.log(`  Orphaned goals: ${stats.orphanedGoals}`);
  } catch (err) {
    console.log(error(`Failed to validate: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
