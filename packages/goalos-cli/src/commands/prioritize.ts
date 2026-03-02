/**
 * prioritize command - Interactive priority setting for goals
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { IntentGraphClass } from '@goalos/core';
import { getGraphPath } from '../config.js';
import { success, error, formatPriority, formatStatus } from '../display.js';
import type { CLIConfig } from '../config.js';
import type { PriorityLevel, Priority } from '@goalos/core';
import inquirer from 'inquirer';

export async function handlePrioritize(config: CLIConfig): Promise<void> {
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

    // Get active and planned goals
    const activeGoals = [
      ...graph.getByStatus('active'),
      ...graph.getByStatus('planned'),
      ...graph.getByStatus('blocked'),
    ];

    if (activeGoals.length === 0) {
      console.log(error('No active goals to prioritize'));
      return;
    }

    // Show current priorities
    console.log('\nCurrent goal priorities:\n');
    activeGoals.forEach((goal, index) => {
      console.log(`  ${index + 1}. ${formatPriority(goal.priority.level)} ${formatStatus(goal.status)} ${goal.title}`);
    });
    console.log('');

    // Select goals to reprioritize
    const { selectedGoals } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedGoals',
        message: 'Select goals to reprioritize:',
        choices: activeGoals.map((goal) => ({
          name: `[${goal.priority.level}] ${goal.title}`,
          value: goal.id,
        })),
      },
    ]);

    if (selectedGoals.length === 0) {
      console.log('No goals selected');
      return;
    }

    // Set priority for each selected goal
    for (const goalId of selectedGoals) {
      const goal = graph.getGoal(goalId);
      if (!goal) continue;

      const { newPriority } = await inquirer.prompt([
        {
          type: 'list',
          name: 'newPriority',
          message: `Priority for "${goal.title}" (current: ${goal.priority.level}):`,
          choices: [
            { name: 'Critical - Urgent and important', value: 'critical' },
            { name: 'High - Important, do soon', value: 'high' },
            { name: 'Medium - Normal priority', value: 'medium' },
            { name: 'Low - Nice to have', value: 'low' },
            { name: 'Someday - When time permits', value: 'someday' },
          ],
          default: goal.priority.level,
        },
      ]);

      const { reason } = await inquirer.prompt([
        {
          type: 'input',
          name: 'reason',
          message: 'Reason for this priority (optional):',
          default: '',
        },
      ]);

      const priority: Priority = {
        level: newPriority as PriorityLevel,
        reason: reason || undefined,
      };

      graph.updateGoal(goalId, { priority });
      console.log(success(`Updated "${goal.title}" to ${formatPriority(newPriority)}`));
    }

    // Save updated graph
    writeFileSync(graphPath, JSON.stringify(graph.toJSON(), null, 2));

    console.log(success(`\nUpdated priorities for ${selectedGoals.length} goal(s)`));
  } catch (err) {
    console.log(error(`Failed to prioritize: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}
