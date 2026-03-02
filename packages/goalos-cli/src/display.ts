/**
 * Terminal Display and Formatting Utilities
 * Provides colored output, trees, tables, and dashboard rendering
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import boxen from 'boxen';
import type { Goal, GoalStatus, PriorityLevel, GoalTreeNode } from '@goalos/core';

/**
 * Priority level colors
 */
const PRIORITY_COLORS = {
  critical: chalk.red,
  high: chalk.yellow,
  medium: chalk.blue,
  low: chalk.cyan,
  someday: chalk.gray
};

/**
 * Status colors
 */
const STATUS_COLORS = {
  active: chalk.green,
  planned: chalk.cyan,
  blocked: chalk.red,
  paused: chalk.yellow,
  completed: chalk.gray,
  abandoned: chalk.gray
};

/**
 * Format a priority level with color
 */
export function formatPriority(level: PriorityLevel): string {
  const color = PRIORITY_COLORS[level];
  return color(level.toUpperCase());
}

/**
 * Format a status with color
 */
export function formatStatus(status: GoalStatus): string {
  const color = STATUS_COLORS[status];
  const icon = {
    active: '●',
    planned: '◯',
    blocked: '✗',
    paused: '⏸',
    completed: '✓',
    abandoned: '⊘'
  }[status];
  return `${color(icon)} ${color(status)}`;
}

/**
 * Render a hierarchical goal tree in ASCII art
 */
export function renderTree(nodes: GoalTreeNode[], maxDepth?: number): string {
  const lines: string[] = [];

  function renderNode(node: GoalTreeNode, prefix = '', isLast = true) {
    if (maxDepth && node.depth > maxDepth) return;

    const connector = isLast ? '└── ' : '├── ';
    const statusIcon = getStatusIcon(node.goal.status);
    const priorityTag = formatPriority(node.goal.priority.level);
    const progressBar = renderProgressBar(node.progress);

    const title = `${statusIcon} ${chalk.bold(node.goal.title)} ${progressBar}`;
    lines.push(prefix + connector + title);

    const extension = isLast ? '    ' : '│   ';
    const newPrefix = prefix + extension;

    node.children.forEach((child, index) => {
      renderNode(child, newPrefix, index === node.children.length - 1);
    });
  }

  nodes.forEach((node, index) => {
    renderNode(node, '', index === nodes.length - 1);
  });

  return lines.join('\n');
}

/**
 * Get status icon
 */
function getStatusIcon(status: GoalStatus): string {
  const icons = {
    active: '●',
    planned: '◯',
    blocked: '✗',
    paused: '⏸',
    completed: '✓',
    abandoned: '⊘'
  };
  return STATUS_COLORS[status](icons[status]);
}

/**
 * Render a simple progress bar
 */
function renderProgressBar(progress: number, width = 10): string {
  const filled = Math.round(progress * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percent = Math.round(progress * 100);
  return chalk.dim(`[${bar}] ${percent}%`);
}

/**
 * Create a table of goals
 */
export function createGoalTable(goals: Goal[]): Table.Table {
  const table = new Table({
    head: [
      chalk.bold('ID'),
      chalk.bold('Title'),
      chalk.bold('Status'),
      chalk.bold('Priority'),
      chalk.bold('Deadline')
    ],
    colWidths: [12, 30, 12, 12, 20],
    wordWrap: true
  });

  goals.forEach((goal) => {
    table.push([
      chalk.gray(goal.id.substring(0, 8)),
      goal.title,
      formatStatus(goal.status),
      formatPriority(goal.priority.level),
      goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '-'
    ]);
  });

  return table;
}

/**
 * Create a status dashboard with key metrics
 */
export function createDashboard(
  activeGoals: number,
  topPriorities: Goal[],
  overdue: Goal[],
  blocked: Goal[],
  completionRate: number
): string {
  const content = `
${chalk.bold.cyan('═══════════════════════════════════════════')}
${chalk.bold.cyan('          GOALOS STATUS DASHBOARD')}
${chalk.bold.cyan('═══════════════════════════════════════════')}

${chalk.bold('Active Goals:')} ${chalk.green(String(activeGoals))}
${chalk.bold('Completion Rate:')} ${renderCompletionGauge(completionRate)}

${chalk.bold.yellow('TOP PRIORITIES (Next 5)')}
${topPriorities.slice(0, 5).map((g) => `  ${formatPriority(g.priority.level)} ${g.title}`).join('\n')}

${overdue.length > 0 ? `${chalk.bold.red('OVERDUE GOALS')}
${overdue.slice(0, 5).map((g) => `  ${chalk.red('⚠')} ${g.title}`).join('\n')}` : ''}

${blocked.length > 0 ? `${chalk.bold.red('BLOCKED GOALS')}
${blocked.slice(0, 5).map((g) => `  ${chalk.red('✗')} ${g.title}`).join('\n')}` : ''}

${chalk.bold.cyan('═══════════════════════════════════════════')}
`;

  return boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan'
  });
}

/**
 * Render a completion rate gauge
 */
function renderCompletionGauge(rate: number): string {
  const width = 20;
  const filled = Math.round(rate * width);
  const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(width - filled));
  return `${bar} ${(rate * 100).toFixed(1)}%`;
}

/**
 * Create a success message
 */
export function success(message: string): string {
  return chalk.green(`✓ ${message}`);
}

/**
 * Create an error message
 */
export function error(message: string): string {
  return chalk.red(`✗ ${message}`);
}

/**
 * Create a warning message
 */
export function warning(message: string): string {
  return chalk.yellow(`⚠ ${message}`);
}

/**
 * Create an info message
 */
export function info(message: string): string {
  return chalk.blue(`ℹ ${message}`);
}

/**
 * Create a dimmed message
 */
export function dim(message: string): string {
  return chalk.dim(message);
}

/**
 * Display a formatted goal detail view
 */
export function displayGoalDetail(goal: Goal): string {
  const lines: string[] = [
    chalk.bold.cyan(`Goal: ${goal.title}`),
    chalk.dim(`ID: ${goal.id}`),
    '',
    `Status: ${formatStatus(goal.status)}`,
    `Priority: ${formatPriority(goal.priority.level)}${goal.priority.reason ? ` - ${goal.priority.reason}` : ''}`
  ];

  if (goal.deadline) {
    const deadline = new Date(goal.deadline);
    const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    lines.push(`Deadline: ${deadline.toLocaleDateString()}${daysLeft < 0 ? chalk.red(` (${Math.abs(daysLeft)} days overdue)`) : daysLeft < 7 ? chalk.yellow(` (${daysLeft} days left)`) : ` (${daysLeft} days left)`}`);
  }

  if (goal.description) {
    lines.push(`Description: ${goal.description}`);
  }

  if (goal.domain) {
    lines.push(`Domain: ${goal.domain}`);
  }

  if (goal.tags && goal.tags.length > 0) {
    lines.push(`Tags: ${goal.tags.join(', ')}`);
  }

  if (goal.successCriteria && goal.successCriteria.length > 0) {
    lines.push('', chalk.bold('Success Criteria:'));
    goal.successCriteria.forEach((criterion) => {
      lines.push(`  • ${criterion}`);
    });
  }

  if (goal.dependencies && goal.dependencies.length > 0) {
    lines.push('', chalk.bold('Dependencies:'));
    goal.dependencies.forEach((dep) => {
      lines.push(`  • ${dep.type}: ${dep.targetGoalId.substring(0, 8)}`);
    });
  }

  lines.push('', chalk.dim(`Created: ${new Date(goal.createdAt).toLocaleString()}`));
  if (goal.completedAt) {
    lines.push(chalk.dim(`Completed: ${new Date(goal.completedAt).toLocaleString()}`));
  }

  return lines.join('\n');
}
