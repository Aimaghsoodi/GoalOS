/**
 * Goal class for managing individual goal objects
 */

import type {
  Goal,
  GoalStatus,
  Priority,
  PriorityLevel,
  Dependency,
  Permission,
  Duration,
  TimeHorizon
} from './types.js';
import {
  generateGoalId,
  getCurrentTimestamp,
  validateGoalStructure,
  deepClone,
  isOverdue,
  daysUntilDeadline
} from './utils.js';

/**
 * Goal class for creating and managing goals
 */
export class GoalClass {
  /**
   * Create a new goal with defaults
   */
  static create(input: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Goal {
    const now = getCurrentTimestamp();
    const goal: Goal = {
      id: generateGoalId(),
      title: input.title,
      description: input.description,
      parentId: input.parentId || null,
      status: input.status || 'planned',
      priority: input.priority || { level: 'medium' },
      successCriteria: input.successCriteria,
      deadline: input.deadline,
      timeHorizon: input.timeHorizon,
      estimatedEffort: input.estimatedEffort,
      motivation: input.motivation,
      tags: input.tags,
      domain: input.domain,
      dependencies: input.dependencies || [],
      permissions: input.permissions || [],
      createdAt: now,
      updatedAt: now,
      completedAt: undefined,
      createdBy: input.createdBy,
      version: 1,
      metadata: input.metadata || {}
    };

    const errors = validateGoalStructure(goal);
    if (errors.length > 0) {
      throw new Error(`Invalid goal: ${errors.join(', ')}`);
    }

    return goal;
  }

  /**
   * Update a goal with new values
   */
  static update(goal: Goal, updates: Partial<Goal>): Goal {
    const updated: Goal = {
      ...goal,
      ...updates,
      id: goal.id, // Prevent ID changes
      createdAt: goal.createdAt, // Prevent creation date changes
      updatedAt: getCurrentTimestamp(),
      version: goal.version + 1
    };

    const errors = validateGoalStructure(updated);
    if (errors.length > 0) {
      throw new Error(`Invalid goal update: ${errors.join(', ')}`);
    }

    return updated;
  }

  /**
   * Mark a goal as completed
   */
  static complete(goal: Goal, completedBy?: string): Goal {
    if (goal.status === 'completed') {
      return goal; // Already completed
    }

    return GoalClass.update(goal, {
      status: 'completed',
      completedAt: getCurrentTimestamp(),
      createdBy: completedBy || goal.createdBy
    });
  }

  /**
   * Mark a goal as abandoned
   */
  static abandon(goal: Goal, reason?: string): Goal {
    if (goal.status === 'abandoned') {
      return goal;
    }

    return GoalClass.update(goal, {
      status: 'abandoned',
      completedAt: getCurrentTimestamp(),
      metadata: {
        ...goal.metadata,
        abandonReason: reason
      }
    });
  }

  /**
   * Block a goal
   */
  static block(goal: Goal, blockedBy?: string): Goal {
    if (goal.status === 'blocked') {
      return goal;
    }

    return GoalClass.update(goal, {
      status: 'blocked',
      metadata: {
        ...goal.metadata,
        blockedBy
      }
    });
  }

  /**
   * Unblock a goal
   */
  static unblock(goal: Goal): Goal {
    if (goal.status !== 'blocked') {
      return goal;
    }

    const metadata = deepClone(goal.metadata || {});
    delete metadata.blockedBy;

    return GoalClass.update(goal, {
      status: 'active',
      metadata
    });
  }

  /**
   * Pause a goal
   */
  static pause(goal: Goal): Goal {
    if (goal.status === 'paused') {
      return goal;
    }

    return GoalClass.update(goal, {
      status: 'paused'
    });
  }

  /**
   * Resume a paused goal
   */
  static resume(goal: Goal): Goal {
    if (goal.status !== 'paused') {
      return goal;
    }

    return GoalClass.update(goal, {
      status: 'active'
    });
  }

  /**
   * Add a dependency to a goal
   */
  static addDependency(goal: Goal, dependency: Dependency): Goal {
    const dependencies = deepClone(goal.dependencies || []);
    if (!dependencies.some(d => d.targetGoalId === dependency.targetGoalId && d.type === dependency.type)) {
      dependencies.push(dependency);
    }

    return GoalClass.update(goal, { dependencies });
  }

  /**
   * Remove a dependency from a goal
   */
  static removeDependency(goal: Goal, targetGoalId: string, type?: string): Goal {
    const dependencies = (goal.dependencies || []).filter(
      d => !(d.targetGoalId === targetGoalId && (!type || d.type === type))
    );

    return GoalClass.update(goal, { dependencies });
  }

  /**
   * Add a permission to a goal
   */
  static addPermission(goal: Goal, permission: Permission): Goal {
    const permissions = deepClone(goal.permissions || []);
    const existingIndex = permissions.findIndex(p => p.agentId === permission.agentId);

    if (existingIndex >= 0) {
      permissions[existingIndex] = permission;
    } else {
      permissions.push(permission);
    }

    return GoalClass.update(goal, { permissions });
  }

  /**
   * Remove a permission from a goal
   */
  static removePermission(goal: Goal, agentId: string): Goal {
    const permissions = (goal.permissions || []).filter(p => p.agentId !== agentId);
    return GoalClass.update(goal, { permissions });
  }

  /**
   * Update goal priority
   */
  static setPriority(goal: Goal, priority: Priority): Goal {
    return GoalClass.update(goal, { priority });
  }

  /**
   * Check if goal is overdue
   */
  static isOverdue(goal: Goal): boolean {
    return isOverdue(goal);
  }

  /**
   * Get days until goal deadline
   */
  static daysUntilDeadline(goal: Goal): number | null {
    return daysUntilDeadline(goal);
  }

  /**
   * Check if goal has all required fields filled
   */
  static isComplete(goal: Goal): boolean {
    return !!(
      goal.title &&
      goal.status &&
      goal.priority &&
      goal.deadline &&
      goal.successCriteria &&
      goal.successCriteria.length > 0
    );
  }

  /**
   * Export goal to JSON
   */
  static toJSON(goal: Goal): string {
    return JSON.stringify(goal, null, 2);
  }

  /**
   * Create goal from JSON
   */
  static fromJSON(json: string | object): Goal {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    const errors = validateGoalStructure(data);
    if (errors.length > 0) {
      throw new Error(`Invalid goal JSON: ${errors.join(', ')}`);
    }
    return data as Goal;
  }
}
