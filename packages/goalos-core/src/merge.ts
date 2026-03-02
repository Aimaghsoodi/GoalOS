/**
 * Merge and synchronization of intent graphs
 */

import type { Goal, IntentGraph, MergeConflict, MergeResult, MergeStrategy } from './types.js';
import { getCurrentTimestamp, deepClone } from './utils.js';

/**
 * Merge engine for combining intent graphs
 */
export class MergeEngine {
  /**
   * Merge two intent graphs
   */
  static merge(
    local: IntentGraph,
    remote: IntentGraph,
    strategy: MergeStrategy = 'latest_wins'
  ): MergeResult {
    const conflicts: MergeConflict[] = [];
    const added: Goal[] = [];
    const updated: Goal[] = [];
    const removed: Goal[] = [];

    // Create maps for quick lookup
    const localMap = new Map(local.goals.map(g => [g.id, g]));
    const remoteMap = new Map(remote.goals.map(g => [g.id, g]));

    // Merge goals
    const mergedGoals: Goal[] = [];

    // Process all local goals
    for (const localGoal of local.goals) {
      const remoteGoal = remoteMap.get(localGoal.id);

      if (!remoteGoal) {
        // Goal exists only locally
        mergedGoals.push(deepClone(localGoal));
      } else {
        // Goal exists in both
        const merged = this.mergeGoal(localGoal, remoteGoal, strategy, conflicts);
        mergedGoals.push(merged);
        updated.push(merged);
      }
    }

    // Process remote goals not in local
    for (const remoteGoal of remote.goals) {
      if (!localMap.has(remoteGoal.id)) {
        mergedGoals.push(deepClone(remoteGoal));
        added.push(remoteGoal);
      }
    }

    // Goals in local but not in remote (removed)
    for (const localGoal of local.goals) {
      if (!remoteMap.has(localGoal.id)) {
        removed.push(localGoal);
      }
    }

    const merged: IntentGraph = {
      id: local.id,
      version: local.version,
      owner: local.owner,
      name: local.name,
      description: local.description,
      goals: mergedGoals,
      defaultPermissions: local.defaultPermissions,
      createdAt: local.createdAt,
      updatedAt: getCurrentTimestamp(),
      metadata: deepClone(local.metadata || {})
    };

    return {
      merged,
      conflicts,
      added,
      updated,
      removed
    };
  }

  /**
   * Merge two individual goals
   */
  private static mergeGoal(
    local: Goal,
    remote: Goal,
    strategy: MergeStrategy,
    conflicts: MergeConflict[]
  ): Goal {
    if (strategy === 'latest_wins') {
      return this.latestWins(local, remote);
    } else if (strategy === 'most_restrictive') {
      return this.mostRestrictive(local, remote);
    } else {
      // 'manual' strategy - return local and record conflicts
      this.detectConflicts(local, remote, conflicts);
      return deepClone(local);
    }
  }

  /**
   * Latest wins strategy - use the goal that was updated most recently
   */
  private static latestWins(local: Goal, remote: Goal): Goal {
    const localTime = new Date(local.updatedAt).getTime();
    const remoteTime = new Date(remote.updatedAt).getTime();

    if (remoteTime > localTime) {
      return deepClone(remote);
    }
    return deepClone(local);
  }

  /**
   * Most restrictive strategy - combine constraints
   */
  private static mostRestrictive(local: Goal, remote: Goal): Goal {
    const merged = deepClone(local);

    // Use earlier deadline
    if (remote.deadline && local.deadline) {
      if (new Date(remote.deadline) < new Date(local.deadline)) {
        merged.deadline = remote.deadline;
      }
    } else if (remote.deadline) {
      merged.deadline = remote.deadline;
    }

    // Use higher priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, someday: 4 };
    if (priorityOrder[remote.priority.level] < priorityOrder[local.priority.level]) {
      merged.priority = remote.priority;
    }

    // Combine success criteria
    const criteria = new Set([...(local.successCriteria || []), ...(remote.successCriteria || [])]);
    merged.successCriteria = Array.from(criteria);

    // Combine tags
    const tags = new Set([...(local.tags || []), ...(remote.tags || [])]);
    merged.tags = Array.from(tags);

    // Use more recent timestamp
    const localTime = new Date(local.updatedAt).getTime();
    const remoteTime = new Date(remote.updatedAt).getTime();
    if (remoteTime > localTime) {
      merged.updatedAt = remote.updatedAt;
      merged.version = Math.max(local.version, remote.version) + 1;
    }

    return merged;
  }

  /**
   * Detect conflicts between two goals
   */
  private static detectConflicts(local: Goal, remote: Goal, conflicts: MergeConflict[]): void {
    const fieldsToCheck: (keyof Goal)[] = [
      'title',
      'description',
      'status',
      'priority',
      'deadline',
      'parentId'
    ];

    for (const field of fieldsToCheck) {
      const localValue = local[field];
      const remoteValue = remote[field];

      if (JSON.stringify(localValue) !== JSON.stringify(remoteValue)) {
        conflicts.push({
          goalId: local.id,
          field,
          localValue,
          remoteValue
        });
      }
    }
  }

  /**
   * Resolve conflicts manually
   */
  static resolveConflict(
    conflict: MergeConflict,
    useLocal: boolean
  ): { field: string; value: unknown } {
    return {
      field: conflict.field,
      value: useLocal ? conflict.localValue : conflict.remoteValue
    };
  }

  /**
   * Get goals that would be merged with conflicts
   */
  static getConflictingSummary(result: MergeResult): string[] {
    const conflictingGoalIds = new Set(result.conflicts.map(c => c.goalId));
    return Array.from(conflictingGoalIds);
  }

  /**
   * Check if merge result has conflicts
   */
  static hasConflicts(result: MergeResult): boolean {
    return result.conflicts.length > 0;
  }

  /**
   * Get merge summary
   */
  static getSummary(result: MergeResult): string {
    const lines = [];
    lines.push(`Merged goals: ${result.merged.goals.length}`);
    lines.push(`Added: ${result.added.length}`);
    lines.push(`Updated: ${result.updated.length}`);
    lines.push(`Removed: ${result.removed.length}`);
    lines.push(`Conflicts: ${result.conflicts.length}`);

    if (result.conflicts.length > 0) {
      const goalIds = new Set(result.conflicts.map(c => c.goalId));
      lines.push(`Conflicting goals: ${Array.from(goalIds).join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Three-way merge (common ancestor, local, remote)
   */
  static threeWayMerge(
    ancestor: IntentGraph,
    local: IntentGraph,
    remote: IntentGraph
  ): MergeResult {
    const conflicts: MergeConflict[] = [];
    const added: Goal[] = [];
    const updated: Goal[] = [];
    const removed: Goal[] = [];

    const ancestorMap = new Map(ancestor.goals.map(g => [g.id, g]));
    const localMap = new Map(local.goals.map(g => [g.id, g]));
    const remoteMap = new Map(remote.goals.map(g => [g.id, g]));

    const mergedGoals: Goal[] = [];

    // Process all goal IDs
    const allIds = new Set([...ancestorMap.keys(), ...localMap.keys(), ...remoteMap.keys()]);

    for (const goalId of allIds) {
      const ancestorGoal = ancestorMap.get(goalId);
      const localGoal = localMap.get(goalId);
      const remoteGoal = remoteMap.get(goalId);

      if (!ancestorGoal && localGoal && !remoteGoal) {
        // Only in local - added locally
        mergedGoals.push(deepClone(localGoal));
        added.push(localGoal);
      } else if (!ancestorGoal && !localGoal && remoteGoal) {
        // Only in remote - added remotely
        mergedGoals.push(deepClone(remoteGoal));
        added.push(remoteGoal);
      } else if (!ancestorGoal && localGoal && remoteGoal) {
        // Created in both - conflict
        conflicts.push({
          goalId,
          field: 'goal',
          localValue: localGoal,
          remoteValue: remoteGoal
        });
        mergedGoals.push(deepClone(localGoal)); // Prefer local for now
      } else if (ancestorGoal && localGoal && !remoteGoal) {
        // Deleted in remote, modified in local - conflict
        conflicts.push({
          goalId,
          field: 'existence',
          localValue: localGoal,
          remoteValue: null
        });
        // Keep local version
        mergedGoals.push(deepClone(localGoal));
      } else if (ancestorGoal && !localGoal && remoteGoal) {
        // Deleted in local, modified in remote - conflict
        conflicts.push({
          goalId,
          field: 'existence',
          localValue: null,
          remoteValue: remoteGoal
        });
        // Keep remote version
        mergedGoals.push(deepClone(remoteGoal));
      } else if (ancestorGoal && localGoal && remoteGoal) {
        // Modified in both
        const localModified = JSON.stringify(ancestorGoal) !== JSON.stringify(localGoal);
        const remoteModified = JSON.stringify(ancestorGoal) !== JSON.stringify(remoteGoal);

        if (localModified && remoteModified) {
          // Both modified - potential conflict
          if (JSON.stringify(localGoal) === JSON.stringify(remoteGoal)) {
            // Same changes - no conflict
            mergedGoals.push(deepClone(localGoal));
          } else {
            // Different changes - conflict
            this.detectConflicts(localGoal, remoteGoal, conflicts);
            mergedGoals.push(deepClone(localGoal)); // Prefer local
          }
        } else if (remoteModified) {
          // Only remote modified
          mergedGoals.push(deepClone(remoteGoal));
          updated.push(remoteGoal);
        } else if (localModified) {
          // Only local modified
          mergedGoals.push(deepClone(localGoal));
          updated.push(localGoal);
        } else {
          // No changes
          mergedGoals.push(deepClone(ancestorGoal));
        }
      }
    }

    const merged: IntentGraph = {
      id: local.id,
      version: local.version,
      owner: local.owner,
      name: local.name,
      description: local.description,
      goals: mergedGoals,
      defaultPermissions: local.defaultPermissions,
      createdAt: local.createdAt,
      updatedAt: getCurrentTimestamp(),
      metadata: deepClone(local.metadata || {})
    };

    return {
      merged,
      conflicts,
      added,
      updated,
      removed
    };
  }
}
