/**
 * export command - Export intent graph to file
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { IntentGraphClass } from '@goalos/core';
import { getGraphPath } from '../config.js';
import { success, error } from '../display.js';
import type { CLIConfig } from '../config.js';

export interface ExportOptions {
  format?: 'json' | 'json-ld';
}

export async function handleExport(
  outputFile: string | undefined,
  options: ExportOptions,
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

    // Export
    let output;
    const format = options.format || 'json';
    if (format === 'json-ld') {
      output = JSON.stringify(graph.toJSONLD(), null, 2);
    } else {
      output = JSON.stringify(graph.toJSON(), null, 2);
    }

    // Write to file or stdout
    if (outputFile) {
      writeFileSync(outputFile, output);
      console.log(success(`Exported intent graph to ${outputFile}`));
    } else {
      console.log(output);
    }
  } catch (err) {
    console.log(error(`Failed to export: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
