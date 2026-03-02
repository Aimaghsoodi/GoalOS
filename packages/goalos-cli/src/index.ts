#!/usr/bin/env node
/**
 * GoalOS CLI Entry Point
 * Registers all commands and parses arguments
 */

import { Command } from 'commander';
import { loadConfig } from './config.js';
import { handleInit } from './commands/init.js';
import { handleAdd } from './commands/add.js';
import { handleList } from './commands/list.js';
import { handleStatus } from './commands/status.js';
import { handleUpdate } from './commands/update.js';
import { handleComplete } from './commands/complete.js';
import { handleBlock } from './commands/block.js';
import { handleTree } from './commands/tree.js';
import { handleExport } from './commands/export.js';
import { handleImport } from './commands/import.js';
import { handleValidate } from './commands/validate.js';
import { handlePrioritize } from './commands/prioritize.js';
import { handleServe } from './commands/serve.js';

const program = new Command();
const config = loadConfig();

program
  .name('goalos')
  .description('GoalOS CLI — manage your personal AI intent graph')
  .version('0.1.0');

// init
program
  .command('init')
  .description('Create a new intent graph')
  .action(() => handleInit(config));

// add
program
  .command('add <title>')
  .description('Add a new goal')
  .option('-d, --description <text>', 'Goal description')
  .option('-p, --parent-id <id>', 'Parent goal ID')
  .option('--priority <level>', 'Priority level (critical, high, medium, low, someday)', 'medium')
  .option('--domain <domain>', 'Goal domain')
  .option('--deadline <date>', 'Deadline (ISO 8601)')
  .option('--time-horizon <horizon>', 'Time horizon (today, this_week, this_month, this_quarter, this_year, long_term)')
  .option('--success-criteria <criteria>', 'Success criteria (pipe-separated)')
  .option('--motivation <text>', 'Why this goal matters')
  .option('--tags <tags>', 'Tags (comma-separated)')
  .action((title, options) => handleAdd(title, options, config));

// list
program
  .command('list')
  .description('Show all goals')
  .option('-f, --format <format>', 'Output format (tree, table, json)', 'tree')
  .option('-s, --status <status>', 'Filter by status (comma-separated)')
  .option('-p, --priority <level>', 'Filter by priority (comma-separated)')
  .option('--domain <domain>', 'Filter by domain')
  .option('--tags <tags>', 'Filter by tags (comma-separated)')
  .option('--completed', 'Include completed goals')
  .action((options) => handleList(options, config));

// status
program
  .command('status')
  .description('Show status dashboard with key metrics')
  .action(() => handleStatus(config));

// update
program
  .command('update <id>')
  .description('Update a goal')
  .option('-t, --title <title>', 'New title')
  .option('-d, --description <text>', 'New description')
  .option('-p, --priority <level>', 'New priority level')
  .option('-s, --status <status>', 'New status')
  .option('--deadline <date>', 'New deadline')
  .option('--domain <domain>', 'New domain')
  .option('--motivation <text>', 'New motivation')
  .option('--tags <tags>', 'New tags (comma-separated)')
  .action((id, options) => handleUpdate(id, options, config));

// complete
program
  .command('complete <id>')
  .description('Mark a goal as completed')
  .option('-n, --notes <notes>', 'Completion notes')
  .action((id, options) => handleComplete(id, options, config));

// block
program
  .command('block <id>')
  .description('Mark a goal as blocked')
  .requiredOption('--by <id>', 'Goal ID that blocks this goal')
  .action((id, options) => handleBlock(id, options, config));

// tree
program
  .command('tree')
  .description('Display full goal hierarchy')
  .option('--max-depth <depth>', 'Maximum tree depth', parseInt)
  .option('--goal-id <id>', 'Show subtree for a specific goal')
  .action((options) => handleTree(options, config));

// export
program
  .command('export [file]')
  .description('Export intent graph to file')
  .option('-f, --format <format>', 'Export format (json, json-ld)', 'json')
  .action((file, options) => handleExport(file, options, config));

// import
program
  .command('import <file>')
  .description('Import intent graph from file')
  .option('-m, --merge', 'Merge with existing graph instead of replacing')
  .action((file, options) => handleImport(file, options, config));

// validate
program
  .command('validate')
  .description('Validate the intent graph')
  .action(() => handleValidate(config));

// prioritize
program
  .command('prioritize')
  .description('Interactively set goal priorities')
  .action(() => handlePrioritize(config));

// serve
program
  .command('serve')
  .description('Start GoalOS MCP server')
  .option('--storage <type>', 'Storage backend (file, sqlite)', 'file')
  .action((options) => handleServe(options, config));

program.parse();
