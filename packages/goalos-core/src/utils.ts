/**
 * Utility functions for GoalOS
 */

import { nanoid } from 'nanoid';
import type { Goal, GoalEvent } from './types.js';

/**
 * Generate a unique goal ID
 */
export function generateGoalId(): string {
  return `goal_${nanoid(8)}`;
}

/**
 * Generate a unique event ID
 */
export function generateEventId(): string {
  return `event_${nanoid(8)}`;
}

/**
 * Generate a unique intent graph ID
 */
export function generateGraphId(): string {
  return `graph_${nanoid(8)}`;
}

/**
 * Get current ISO 8601 timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Parse ISO 8601 date string to Date object
 */
export function parseISODate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Check if a date string is valid ISO 8601
 */
export function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Check if a string is a valid nanoid-based ID
 */
export function isValidGoalId(id: string): boolean {
  return /^goal_[a-zA-Z0-9_-]{8}$/.test(id);
}

/**
 * Deep clone an object (simple implementation)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  if (obj instanceof Object) {
    const clonedObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone((obj as Record<string, unknown>)[key]);
      }
    }
    return clonedObj as T;
  }
  return obj;
}

/**
 * Calculate goal completion progress (0-1)
 */
export function calculateProgress(goal: Goal, childGoals: Goal[]): number {
  if (goal.status === 'completed') {
    return 1;
  }
  if (goal.status === 'abandoned') {
    return 0;
  }
  if (childGoals.length === 0) {
    // Leaf goal - estimate based on status
    if (goal.status === 'active' || goal.status === 'blocked') {
      return 0.5;
    }
    if (goal.status === 'paused') {
      return 0.25;
    }
    return 0;
  }
  // Parent goal - average of children
  const childProgress = childGoals.reduce((sum, child) => {
    return sum + (child.status === 'completed' ? 1 : 0);
  }, 0);
  return childProgress / childGoals.length;
}

/**
 * Sort goals by priority
 */
export function sortByPriority(goals: Goal[]): Goal[] {
  const priorityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    someday: 4
  };
  return [...goals].sort((a, b) => {
    const aScore = a.priority.score ?? (priorityOrder[a.priority.level] * 25);
    const bScore = b.priority.score ?? (priorityOrder[b.priority.level] * 25);
    return aScore - bScore;
  });
}

/**
 * Check if a goal is overdue
 */
export function isOverdue(goal: Goal): boolean {
  if (!goal.deadline) {
    return false;
  }
  if (goal.status === 'completed' || goal.status === 'abandoned') {
    return false;
  }
  const deadlineDate = new Date(goal.deadline);
  return deadlineDate < new Date();
}

/**
 * Get days until deadline
 */
export function daysUntilDeadline(goal: Goal): number | null {
  if (!goal.deadline) {
    return null;
  }
  const deadlineDate = new Date(goal.deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Validate goal structure
 */
export function validateGoalStructure(goal: Goal): string[] {
  const errors: string[] = [];

  if (!goal.id || !isValidGoalId(goal.id)) {
    errors.push(`Invalid goal ID format: ${goal.id}`);
  }
  if (!goal.title || goal.title.trim() === '') {
    errors.push('Goal title is required and cannot be empty');
  }
  if (!goal.status) {
    errors.push('Goal status is required');
  }
  if (!goal.priority || !goal.priority.level) {
    errors.push('Goal priority is required');
  }
  if (!isValidISODate(goal.createdAt)) {
    errors.push(`Invalid createdAt timestamp: ${goal.createdAt}`);
  }
  if (!isValidISODate(goal.updatedAt)) {
    errors.push(`Invalid updatedAt timestamp: ${goal.updatedAt}`);
  }
  if (goal.completedAt && !isValidISODate(goal.completedAt)) {
    errors.push(`Invalid completedAt timestamp: ${goal.completedAt}`);
  }
  if (goal.deadline && !isValidISODate(goal.deadline)) {
    errors.push(`Invalid deadline timestamp: ${goal.deadline}`);
  }
  if (typeof goal.version !== 'number' || goal.version < 0) {
    errors.push(`Invalid version: ${goal.version}`);
  }

  return errors;
}

/**
 * Build a map of goal IDs to goals for quick lookup
 */
export function buildGoalMap(goals: Goal[]): Map<string, Goal> {
  const map = new Map<string, Goal>();
  for (const goal of goals) {
    map.set(goal.id, goal);
  }
  return map;
}

/**
 * Get all ancestor IDs of a goal
 */
export function getAncestorIds(goalId: string, goalMap: Map<string, Goal>): string[] {
  const ancestors: string[] = [];
  let currentId: string | undefined = goalId;

  while (currentId) {
    const goal = goalMap.get(currentId);
    if (!goal || !goal.parentId) {
      break;
    }
    ancestors.push(goal.parentId);
    currentId = goal.parentId;
  }

  return ancestors;
}

/**
 * Get all descendant IDs of a goal
 */
export function getDescendantIds(goalId: string, goalMap: Map<string, Goal>): string[] {
  const descendants: string[] = [];

  for (const [id, goal] of goalMap.entries()) {
    if (goal.parentId === goalId) {
      descendants.push(id);
      descendants.push(...getDescendantIds(id, goalMap));
    }
  }

  return descendants;
}

/**
 * Check if one goal is an ancestor of another
 */
export function isAncestor(potentialAncestorId: string, goalId: string, goalMap: Map<string, Goal>): boolean {
  const ancestors = getAncestorIds(goalId, goalMap);
  return ancestors.includes(potentialAncestorId);
}

/**
 * Calculate age of goal in days
 */
export function getGoalAge(goal: Goal): number {
  const createdDate = new Date(goal.createdAt);
  const now = new Date();
  const diffTime = now.getTime() - createdDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
