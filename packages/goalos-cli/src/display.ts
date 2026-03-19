/**
 * Terminal display and formatting utilities.
 */

import chalk from 'chalk';
import type { ChalkInstance } from 'chalk';
import Table from 'cli-table3';
import boxen from 'boxen';
import type { Goal, GoalStatus, GoalTreeNode, PriorityLevel } from '@goalos/core';

const PRIORITY_COLORS: Record<PriorityLevel, ChalkInstance> = {
  critical: chalk.red,
  high: chalk.yellow,
  medium: chalk.blue,
  low: chalk.cyan,
  someday: chalk.gray
};

const STATUS_COLORS: Record<GoalStatus, ChalkInstance> = {
  active: chalk.green,
  planned: chalk.cyan,
  blocked: chalk.red,
  paused: chalk.yellow,
  completed: chalk.gray,
  abandoned: chalk.gray
};

const STATUS_ICONS: Record<GoalStatus, string> = {
  active: '*',
  planned: '-',
  blocked: '!',
  paused: '=',
  completed: '+',
  abandoned: 'x'
};

export function formatPriority(level: PriorityLevel): string {
  return PRIORITY_COLORS[level](level.toUpperCase());
}

export function formatStatus(status: GoalStatus): string {
  const color = STATUS_COLORS[status];
  return `${color(STATUS_ICONS[status])} ${color(status)}`;
}

export function renderTree(nodes: GoalTreeNode[], maxDepth?: number): string {
  const lines: string[] = [];

  const renderNode = (node: GoalTreeNode, prefix = '', isLast = true): void => {
    if (maxDepth !== undefined && node.depth > maxDepth) {
      return;
    }

    const connector = isLast ? '\\-- ' : '|-- ';
    const nextPrefix = prefix + (isLast ? '    ' : '|   ');
    const title = `${getStatusIcon(node.goal.status)} ${chalk.bold(node.goal.title)} ${renderProgressBar(node.progress)}`;

    lines.push(prefix + connector + title);

    node.children.forEach((child, index) => {
      renderNode(child, nextPrefix, index === node.children.length - 1);
    });
  };

  nodes.forEach((node, index) => {
    renderNode(node, '', index === nodes.length - 1);
  });

  return lines.join('\n');
}

function getStatusIcon(status: GoalStatus): string {
  return STATUS_COLORS[status](STATUS_ICONS[status]);
}

function renderProgressBar(progress: number, width = 10): string {
  const safeProgress = Math.min(1, Math.max(0, progress));
  const filled = Math.round(safeProgress * width);
  const empty = width - filled;
  const bar = '#'.repeat(filled) + '-'.repeat(empty);
  const percent = Math.round(safeProgress * 100);
  return chalk.dim(`[${bar}] ${percent}%`);
}

export function createGoalTable(goals: Goal[]): Table.Table {
  const table = new Table({
    head: [
      chalk.bold('ID'),
      chalk.bold('Title'),
      chalk.bold('Status'),
      chalk.bold('Priority'),
      chalk.bold('Deadline')
    ],
    colWidths: [12, 30, 14, 12, 20],
    wordWrap: true
  });

  for (const goal of goals) {
    table.push([
      chalk.gray(goal.id.substring(0, 8)),
      goal.title,
      formatStatus(goal.status),
      formatPriority(goal.priority.level),
      goal.deadline ? new Date(goal.deadline).toLocaleDateString() : '-'
    ]);
  }

  return table;
}

export function createDashboard(
  activeGoals: number,
  topPriorities: Goal[],
  overdue: Goal[],
  blocked: Goal[],
  completionRate: number
): string {
  const sections: string[] = [
    chalk.bold.cyan('GOALOS STATUS DASHBOARD'),
    '',
    `${chalk.bold('Active Goals:')} ${chalk.green(String(activeGoals))}`,
    `${chalk.bold('Completion Rate:')} ${renderCompletionGauge(completionRate)}`,
    '',
    chalk.bold.yellow('TOP PRIORITIES')
  ];

  if (topPriorities.length === 0) {
    sections.push(chalk.dim('  No active priorities.'));
  } else {
    sections.push(...topPriorities.slice(0, 5).map((goal) => `  ${formatPriority(goal.priority.level)} ${goal.title}`));
  }

  if (overdue.length > 0) {
    sections.push('', chalk.bold.red('OVERDUE GOALS'));
    sections.push(...overdue.slice(0, 5).map((goal) => `  ${chalk.red('!')} ${goal.title}`));
  }

  if (blocked.length > 0) {
    sections.push('', chalk.bold.red('BLOCKED GOALS'));
    sections.push(...blocked.slice(0, 5).map((goal) => `  ${chalk.red('x')} ${goal.title}`));
  }

  return boxen(sections.join('\n'), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan'
  });
}

function renderCompletionGauge(rate: number): string {
  const width = 20;
  const safeRate = Math.min(1, Math.max(0, rate));
  const filled = Math.round(safeRate * width);
  const bar = chalk.green('#'.repeat(filled)) + chalk.gray('-'.repeat(width - filled));
  return `${bar} ${(safeRate * 100).toFixed(1)}%`;
}

export function success(message: string): string {
  return chalk.green(`[ok] ${message}`);
}

export function error(message: string): string {
  return chalk.red(`[error] ${message}`);
}

export function warning(message: string): string {
  return chalk.yellow(`[warn] ${message}`);
}

export function info(message: string): string {
  return chalk.blue(`[info] ${message}`);
}

export function dim(message: string): string {
  return chalk.dim(message);
}

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
    let deadlineSuffix = ` (${daysLeft} days left)`;

    if (daysLeft < 0) {
      deadlineSuffix = chalk.red(` (${Math.abs(daysLeft)} days overdue)`);
    } else if (daysLeft < 7) {
      deadlineSuffix = chalk.yellow(` (${daysLeft} days left)`);
    }

    lines.push(`Deadline: ${deadline.toLocaleDateString()}${deadlineSuffix}`);
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
    lines.push(...goal.successCriteria.map((criterion) => `  - ${criterion}`));
  }

  if (goal.dependencies && goal.dependencies.length > 0) {
    lines.push('', chalk.bold('Dependencies:'));
    lines.push(...goal.dependencies.map((dependency) => `  - ${dependency.type}: ${dependency.targetGoalId.substring(0, 8)}`));
  }

  lines.push('', chalk.dim(`Created: ${new Date(goal.createdAt).toLocaleString()}`));
  if (goal.completedAt) {
    lines.push(chalk.dim(`Completed: ${new Date(goal.completedAt).toLocaleString()}`));
  }

  return lines.join('\n');
}
