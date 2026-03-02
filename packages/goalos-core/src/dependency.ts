/**
 * Dependency resolution and cycle detection for goals
 */

import type { Goal, Dependency } from './types.js';
import { buildGoalMap, getDescendantIds } from './utils.js';

/**
 * Dependency analyzer for goal graphs
 */
export class DependencyResolver {
  /**
   * Get all goals that a goal depends on (blockers, requirements, etc.)
   */
  static getDependencies(goal: Goal, goals: Goal[]): Goal[] {
    const goalMap = buildGoalMap(goals);
    const dependencies: Goal[] = [];

    for (const dep of goal.dependencies || []) {
      const depGoal = goalMap.get(dep.targetGoalId);
      if (depGoal) {
        dependencies.push(depGoal);
      }
    }

    return dependencies;
  }

  /**
   * Get all goals that depend on this goal (dependents)
   */
  static getDependents(goal: Goal, goals: Goal[]): Goal[] {
    const dependents: Goal[] = [];

    for (const otherGoal of goals) {
      if (otherGoal.id === goal.id) continue;
      for (const dep of otherGoal.dependencies || []) {
        if (dep.targetGoalId === goal.id) {
          dependents.push(otherGoal);
        }
      }
    }

    return dependents;
  }

  /**
   * Get all blocking goals (goals that prevent this one)
   */
  static getBlockers(goal: Goal, goals: Goal[]): Goal[] {
    const goalMap = buildGoalMap(goals);
    const blockers: Goal[] = [];

    for (const dep of goal.dependencies || []) {
      if (dep.type === 'requires' || dep.type === 'blocks') {
        const depGoal = goalMap.get(dep.targetGoalId);
        if (depGoal && depGoal.status !== 'completed') {
          blockers.push(depGoal);
        }
      }
    }

    return blockers;
  }

  /**
   * Get all enabling goals (goals that enable this one)
   */
  static getEnablers(goal: Goal, goals: Goal[]): Goal[] {
    const enablers: Goal[] = [];

    // Find all goals that have an 'enables' dependency pointing to this goal
    for (const other of goals) {
      if (other.id === goal.id) continue;
      for (const dep of other.dependencies || []) {
        if (dep.type === 'enables' && dep.targetGoalId === goal.id) {
          enablers.push(other);
          break;
        }
      }
    }

    return enablers;
  }

  /**
   * Get all related goals
   */
  static getRelated(goal: Goal, goals: Goal[]): Goal[] {
    const goalMap = buildGoalMap(goals);
    const related: Goal[] = [];
    const seen = new Set<string>();

    for (const dep of goal.dependencies || []) {
      if (dep.type === 'related') {
        const depGoal = goalMap.get(dep.targetGoalId);
        if (depGoal && !seen.has(depGoal.id)) {
          related.push(depGoal);
          seen.add(depGoal.id);
        }
      }
    }

    // Also get goals that reference this one as related
    for (const otherGoal of goals) {
      if (otherGoal.id === goal.id) continue;
      for (const dep of otherGoal.dependencies || []) {
        if (dep.type === 'related' && dep.targetGoalId === goal.id && !seen.has(otherGoal.id)) {
          related.push(otherGoal);
          seen.add(otherGoal.id);
        }
      }
    }

    return related;
  }

  /**
   * Get the dependency chain - all goals that must complete for this one
   */
  static getDependencyChain(goal: Goal, goals: Goal[]): Goal[] {
    const chain: Goal[] = [];
    const visited = new Set<string>();

    const traverse = (current: Goal) => {
      if (visited.has(current.id)) return;
      visited.add(current.id);

      const deps = this.getDependencies(current, goals);
      for (const dep of deps) {
        chain.push(dep);
        traverse(dep);
      }
    };

    traverse(goal);
    return chain;
  }

  /**
   * Detect circular dependencies in the goal graph
   * Returns array of cycles (each cycle is an array of goal IDs)
   */
  static detectCycles(goals: Goal[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (goalId: string, path: string[]): void => {
      visited.add(goalId);
      recursionStack.add(goalId);
      path.push(goalId);

      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      for (const dep of goal.dependencies || []) {
        if (!visited.has(dep.targetGoalId)) {
          dfs(dep.targetGoalId, [...path]);
        } else if (recursionStack.has(dep.targetGoalId)) {
          // Found a cycle
          const cycleStart = path.indexOf(dep.targetGoalId);
          if (cycleStart !== -1) {
            const cycle = path.slice(cycleStart);
            cycle.push(dep.targetGoalId);
            cycles.push(cycle);
          }
        }
      }

      recursionStack.delete(goalId);
    };

    for (const goal of goals) {
      if (!visited.has(goal.id)) {
        dfs(goal.id, []);
      }
    }

    return cycles;
  }

  /**
   * Check if a dependency would create a cycle
   */
  static wouldCreateCycle(sourceGoalId: string, targetGoalId: string, goals: Goal[]): boolean {
    if (sourceGoalId === targetGoalId) {
      return true;
    }

    // Check if targetGoalId can reach sourceGoalId
    const visited = new Set<string>();
    const queue: string[] = [targetGoalId];
    visited.add(targetGoalId);

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === sourceGoalId) {
        return true;
      }

      const goal = goals.find(g => g.id === current);
      if (goal) {
        for (const dep of goal.dependencies || []) {
          if (!visited.has(dep.targetGoalId)) {
            visited.add(dep.targetGoalId);
            queue.push(dep.targetGoalId);
          }
        }
      }
    }

    return false;
  }

  /**
   * Get all goals that are currently blocked (have active blockers)
   */
  static getBlockedGoals(goals: Goal[]): Goal[] {
    const blocked: Goal[] = [];

    for (const goal of goals) {
      if (goal.status === 'blocked' || goal.status === 'paused') {
        continue; // Already marked as such
      }

      const blockers = this.getBlockers(goal, goals);
      if (blockers.length > 0) {
        blocked.push(goal);
      }
    }

    return blocked;
  }

  /**
   * Get all goals that are unblocked (ready to start)
   */
  static getUnblockedGoals(goals: Goal[]): Goal[] {
    const unblocked: Goal[] = [];

    for (const goal of goals) {
      if (goal.status !== 'active' && goal.status !== 'planned') {
        continue;
      }

      const blockers = this.getBlockers(goal, goals);
      if (blockers.length === 0) {
        unblocked.push(goal);
      }
    }

    return unblocked;
  }

  /**
   * Get the critical path - sequence of dependent goals
   */
  static getCriticalPath(goals: Goal[]): Goal[] {
    // Start with root goals (no blockers)
    const roots = goals.filter(g => {
      const blockers = this.getBlockers(g, goals);
      return blockers.length === 0 && (g.status === 'active' || g.status === 'planned');
    });

    if (roots.length === 0) return [];

    // Find longest dependency chain
    let longestPath: Goal[] = [];

    for (const root of roots) {
      const chain = this.getDependencyChain(root, goals);
      const path = [root, ...chain];

      if (path.length > longestPath.length) {
        longestPath = path;
      }
    }

    return longestPath;
  }

  /**
   * Validate all dependencies reference valid goals
   */
  static validateDependencies(goals: Goal[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const goalIds = new Set(goals.map(g => g.id));

    for (const goal of goals) {
      for (const dep of goal.dependencies || []) {
        if (!goalIds.has(dep.targetGoalId)) {
          errors.push(`Goal ${goal.id} references non-existent dependency ${dep.targetGoalId}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
