/**
 * GoalOS MCP Tool Handlers
 * Implements handler functions for all 9 MCP tools
 */

import {
  IntentGraphClass,
  isOverdue,
  daysUntilDeadline,
} from '@goalos/core';
import type {
  Goal,
  GoalStatus,
  PriorityLevel,
  TimeHorizon,
  Priority,
  Dependency,
  DependencyType,
  GoalFilter,
} from '@goalos/core';
import type { IStorage } from './storage.js';

/**
 * Load the IntentGraphClass instance from storage
 */
async function loadGraph(storage: IStorage): Promise<IntentGraphClass> {
  const initialized = await storage.isInitialized();
  if (!initialized) {
    await storage.initialize();
  }
  const data = await storage.load();
  return IntentGraphClass.fromJSON(data);
}

/**
 * Save the IntentGraphClass instance to storage
 */
async function saveGraph(storage: IStorage, graph: IntentGraphClass): Promise<void> {
  await storage.save(graph.toJSON() as any);
}

/**
 * Format a goal for MCP response output
 */
function formatGoal(goal: Goal): Record<string, unknown> {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    status: goal.status,
    priority: goal.priority,
    parentId: goal.parentId,
    domain: goal.domain,
    deadline: goal.deadline,
    timeHorizon: goal.timeHorizon,
    tags: goal.tags,
    successCriteria: goal.successCriteria,
    motivation: goal.motivation,
    dependencies: goal.dependencies,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    completedAt: goal.completedAt,
  };
}

// ========== TOOL HANDLERS ==========

/**
 * goalos_get_context — Get summary of current priorities, active goals, deadlines, blocked items
 */
export async function handleGetContext(
  storage: IStorage,
  _args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const graph = await loadGraph(storage);
  const stats = graph.getStats();
  const topPriorities = graph.getTopPriorities(5);
  const blockedGoals = graph.getByStatus('blocked');
  const allGoals = graph.query({});
  const overdueGoals = allGoals.filter((g) => g.deadline && isOverdue(g));

  const upcomingDeadlines = allGoals
    .filter((g) => g.deadline && !isOverdue(g) && g.status !== 'completed' && g.status !== 'abandoned')
    .sort((a, b) => {
      const daysA = daysUntilDeadline(a);
      const daysB = daysUntilDeadline(b);
      return (daysA ?? Infinity) - (daysB ?? Infinity);
    })
    .slice(0, 5);

  return {
    summary: {
      totalGoals: stats.totalGoals,
      activeGoals: stats.byStatus.active || 0,
      completedGoals: stats.byStatus.completed || 0,
      blockedGoals: stats.byStatus.blocked || 0,
      completionRate: `${(stats.completionRate * 100).toFixed(1)}%`,
    },
    topPriorities: topPriorities.map(formatGoal),
    blockedGoals: blockedGoals.map(formatGoal),
    overdueGoals: overdueGoals.map(formatGoal),
    upcomingDeadlines: upcomingDeadlines.map((g) => ({
      ...formatGoal(g),
      daysUntilDeadline: daysUntilDeadline(g),
    })),
    byStatus: stats.byStatus,
    byPriority: stats.byPriority,
  };
}

/**
 * goalos_list_goals — List goals with optional filtering, returns hierarchical tree
 */
export async function handleListGoals(
  storage: IStorage,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const graph = await loadGraph(storage);

  const filter: GoalFilter = {};
  if (args.status) filter.status = args.status as GoalStatus[];
  if (args.priority) filter.priority = args.priority as PriorityLevel[];
  if (args.domain) filter.domain = args.domain as string;

  let goals = graph.query(filter);

  if (!args.include_completed) {
    goals = goals.filter((g) => g.status !== 'completed' && g.status !== 'abandoned');
  }

  // Build hierarchical structure
  const tree = graph.getTree();

  return {
    goals: goals.map(formatGoal),
    total: goals.length,
    tree: tree.map((node) => formatTreeNode(node)),
  };
}

function formatTreeNode(node: any): Record<string, unknown> {
  return {
    goal: formatGoal(node.goal),
    children: node.children.map((child: any) => formatTreeNode(child)),
    depth: node.depth,
    progress: node.progress,
  };
}

/**
 * goalos_get_priorities — Top N priority goals for a time horizon
 */
export async function handleGetPriorities(
  storage: IStorage,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const graph = await loadGraph(storage);
  const count = (args.count as number) || 5;
  const timeHorizon = args.time_horizon as TimeHorizon | undefined;

  let priorities = graph.getTopPriorities(count);

  if (timeHorizon) {
    const horizonGoals = graph.getByTimeHorizon(timeHorizon);
    const horizonIds = new Set(horizonGoals.map((g) => g.id));
    priorities = priorities.filter((g) => horizonIds.has(g.id));
    if (priorities.length < count) {
      // Fill with additional horizon goals sorted by priority
      const additional = horizonGoals
        .filter((g) => !priorities.some((p) => p.id === g.id))
        .slice(0, count - priorities.length);
      priorities = [...priorities, ...additional];
    }
  }

  return {
    priorities: priorities.slice(0, count).map(formatGoal),
    count: Math.min(priorities.length, count),
    timeHorizon: timeHorizon || 'all',
  };
}

/**
 * goalos_get_goal — Full details of one goal with sub-goals and dependencies
 */
export async function handleGetGoal(
  storage: IStorage,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const graph = await loadGraph(storage);
  const goalId = args.goal_id as string;

  if (!goalId) {
    throw new Error('goal_id is required');
  }

  const goal = graph.getGoal(goalId);
  if (!goal) {
    throw new Error(`Goal not found: ${goalId}`);
  }

  const children = graph.getChildren(goalId);
  const blockers = graph.getBlockers(goalId);
  const progress = graph.getProgress(goalId);

  return {
    goal: formatGoal(goal),
    children: children.map(formatGoal),
    blockers: blockers.map(formatGoal),
    progress: `${(progress * 100).toFixed(1)}%`,
    history: graph.getHistory(goalId),
  };
}

/**
 * goalos_add_goal — Add a new goal to the intent graph
 */
export async function handleAddGoal(
  storage: IStorage,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const graph = await loadGraph(storage);

  const title = args.title as string;
  if (!title) {
    throw new Error('title is required');
  }

  const priorityLevel = (args.priority as PriorityLevel) || 'medium';
  const priority: Priority = {
    level: priorityLevel,
  };

  const goal = graph.addGoal({
    title,
    description: args.description as string | undefined,
    parentId: args.parent_id as string | undefined,
    priority,
    domain: args.domain as string | undefined,
    deadline: args.deadline as string | undefined,
    timeHorizon: args.time_horizon as TimeHorizon | undefined,
    successCriteria: args.success_criteria as string[] | undefined,
    motivation: args.motivation as string | undefined,
    tags: args.tags as string[] | undefined,
    status: 'active',
  });

  await saveGraph(storage, graph);

  return {
    message: `Created goal: ${goal.title}`,
    goal: formatGoal(goal),
  };
}

/**
 * goalos_update_goal — Update goal details, status, or priority
 */
export async function handleUpdateGoal(
  storage: IStorage,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const graph = await loadGraph(storage);

  const goalId = args.goal_id as string;
  if (!goalId) {
    throw new Error('goal_id is required');
  }

  const existing = graph.getGoal(goalId);
  if (!existing) {
    throw new Error(`Goal not found: ${goalId}`);
  }

  const updates: Partial<Goal> = {};
  if (args.title !== undefined) updates.title = args.title as string;
  if (args.description !== undefined) updates.description = args.description as string;
  if (args.status !== undefined) updates.status = args.status as GoalStatus;
  if (args.priority !== undefined) {
    updates.priority = {
      ...existing.priority,
      level: args.priority as PriorityLevel,
    };
  }
  if (args.deadline !== undefined) updates.deadline = args.deadline as string;
  if (args.motivation !== undefined) updates.motivation = args.motivation as string;
  if (args.success_criteria !== undefined) updates.successCriteria = args.success_criteria as string[];

  const updated = graph.updateGoal(goalId, updates);
  await saveGraph(storage, graph);

  return {
    message: `Updated goal: ${updated.title}`,
    goal: formatGoal(updated),
  };
}

/**
 * goalos_complete_goal — Mark goal done, auto-update parent progress and unblock dependents
 */
export async function handleCompleteGoal(
  storage: IStorage,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const graph = await loadGraph(storage);

  const goalId = args.goal_id as string;
  if (!goalId) {
    throw new Error('goal_id is required');
  }

  const existing = graph.getGoal(goalId);
  if (!existing) {
    throw new Error(`Goal not found: ${goalId}`);
  }

  const completed = graph.completeGoal(goalId, 'mcp-agent');
  await saveGraph(storage, graph);

  // Check if parent exists and calculate its progress
  let parentProgress: string | undefined;
  if (completed.parentId) {
    const progress = graph.getProgress(completed.parentId);
    parentProgress = `${(progress * 100).toFixed(1)}%`;
  }

  return {
    message: `Completed goal: ${completed.title}`,
    goal: formatGoal(completed),
    parentProgress,
    notes: args.notes as string | undefined,
  };
}

/**
 * goalos_add_dependency — Add dependency between goals
 */
export async function handleAddDependency(
  storage: IStorage,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const graph = await loadGraph(storage);

  const goalId = args.goal_id as string;
  const dependsOn = args.depends_on as string;

  if (!goalId) throw new Error('goal_id is required');
  if (!dependsOn) throw new Error('depends_on is required');

  const goal = graph.getGoal(goalId);
  if (!goal) throw new Error(`Goal not found: ${goalId}`);

  const targetGoal = graph.getGoal(dependsOn);
  if (!targetGoal) throw new Error(`Target goal not found: ${dependsOn}`);

  const depType = (args.type as DependencyType) || 'requires';

  const dependency: Dependency = {
    type: depType,
    targetGoalId: dependsOn,
    description: args.description as string | undefined,
  };

  graph.addDependency(goalId, dependency);
  await saveGraph(storage, graph);

  return {
    message: `Added dependency: "${goal.title}" ${depType} "${targetGoal.title}"`,
    goalId,
    dependsOn,
    type: depType,
  };
}

/**
 * goalos_search — Full-text search across titles, descriptions, tags
 */
export async function handleSearch(
  storage: IStorage,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const graph = await loadGraph(storage);

  const query = args.query as string;
  if (!query) {
    throw new Error('query is required');
  }

  const filter: GoalFilter = {
    search: query,
  };

  if (args.status) {
    filter.status = args.status as GoalStatus[];
  }

  const results = graph.query(filter);

  return {
    query,
    results: results.map(formatGoal),
    total: results.length,
  };
}

/**
 * Route a tool call to the appropriate handler
 */
export async function handleToolCall(
  toolName: string,
  args: Record<string, unknown>,
  storage: IStorage
): Promise<Record<string, unknown>> {
  switch (toolName) {
    case 'goalos_get_context':
      return handleGetContext(storage, args);
    case 'goalos_list_goals':
      return handleListGoals(storage, args);
    case 'goalos_get_priorities':
      return handleGetPriorities(storage, args);
    case 'goalos_get_goal':
      return handleGetGoal(storage, args);
    case 'goalos_add_goal':
      return handleAddGoal(storage, args);
    case 'goalos_update_goal':
      return handleUpdateGoal(storage, args);
    case 'goalos_complete_goal':
      return handleCompleteGoal(storage, args);
    case 'goalos_add_dependency':
      return handleAddDependency(storage, args);
    case 'goalos_search':
      return handleSearch(storage, args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
