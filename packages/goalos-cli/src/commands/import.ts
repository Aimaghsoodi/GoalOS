/**
 * import command - Import intent graph from file
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { IntentGraphClass } from '@goalos/core';
import { getGraphPath } from '../config.js';
import { success, error } from '../display.js';
import type { CLIConfig } from '../config.js';

export interface ImportOptions {
  merge?: boolean; // Merge with existing graph instead of replacing
}

export async function handleImport(
  inputFile: string,
  options: ImportOptions,
  config: CLIConfig
): Promise<void> {
  const graphPath = getGraphPath(config);

  // Check if input file exists
  if (!existsSync(inputFile)) {
    console.log(error(`Input file not found: ${inputFile}`));
    process.exit(1);
  }

  try {
    // Read input file
    const inputData = readFileSync(inputFile, 'utf-8');
    const importedGraph = IntentGraphClass.fromJSON(JSON.parse(inputData));

    let resultGraph = importedGraph;

    // Merge if existing graph exists and merge flag is set
    if (options.merge && existsSync(graphPath)) {
      const existingData = readFileSync(graphPath, 'utf-8');
      const existingGraph = IntentGraphClass.fromJSON(JSON.parse(existingData));
      const mergeResult = existingGraph.merge(importedGraph.toJSON() as any, 'latest_wins');
      resultGraph = IntentGraphClass.fromJSON(mergeResult.merged);
      console.log(success(`Merged ${mergeResult.added.length} new goals`));
      console.log(success(`Updated ${mergeResult.updated.length} existing goals`));
    } else {
      console.log(success('Imported intent graph'));
    }

    // Save result
    writeFileSync(graphPath, JSON.stringify(resultGraph.toJSON(), null, 2));
    console.log(success(`Saved to ${graphPath}`));

    // Show stats
    const stats = resultGraph.getStats();
    console.log(`  Total goals: ${stats.totalGoals}`);
  } catch (err) {
    console.log(error(`Failed to import: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
