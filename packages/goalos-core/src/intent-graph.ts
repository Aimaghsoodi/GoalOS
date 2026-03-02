/**
 * IntentGraph - Core data structure for managing goals and relationships
 */

import type {
  Goal,
  IntentGraph,
  GoalStatus,
  Dependency,
  Permission,
  GoalFilter,
  GoalTreeNode,
  MergeResult,
  MergeStrategy,
  ValidationResult,
  GraphStats
} from './types.js';
import { GoalClass } from './goal.js';
import { DependencyResolver } from './dependency.js';
import { PriorityEngine } from './priority.js';
import { PermissionManager } from './permissions.js';
import { EventEmitter, EventLogger } from './events.js';
import { Serializer } from './serialization.js';
import { Validator } from './validation.js';
import { QueryEngine } from './query.js';
import { MergeEngine } from './merge.js';
import { generateGraphId, getCurrentTimestamp, deepClone, calculateProgress } from './utils.js';

/**
 * IntentGraph class - manages the complete goal hierarchy
 */
export class IntentGraphClass {
  private graph: IntentGraph;
  private eventEmitter: EventEmitter;
  private eventLogger: EventLogger;
  private validator: Validator;

  /**
   * Create a new empty intent graph
   */
  static create(owner: string, name?: string): IntentGraphClass {
    const now = getCurrentTimestamp();
    const graph: IntentGraph = {
      id: generateGraphId(),
      version: '0.1.0',
      owner,
      name,
      description: undefined,
      goals: [],
      defaultPermissions: [],
      createdAt: now,
      updatedAt: now,
      metadata: {}
    };

    return new IntentGraphClass(graph);
  }

  /**
   * Create from JSON object
   */
  static fromJSON(json: string | object): IntentGraphClass {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new IntentGraphClass(data as IntentGraph);
  }

  /**
   * Constructor
   */
  constructor(graph: IntentGraph) {
    this.graph = deepClone(graph);
    this.eventEmitter = new EventEmitter();
    this.eventLogger = new EventLogger();
    this.validator = new Validator();
  }

  /**
   * Add a new goal
   */
  addGoal(input: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Goal {
    const goal = GoalClass.create(input);
    this.graph.goals.push(goal);
    this.graph.updatedAt = getCurrentTimestamp();

    this.eventLogger.logCreated(goal);
    this.eventEmitter.emit({
      id: `event_${Date.now()}`,
      type: 'goal.created',
      goalId: goal.id,
      timestamp: getCurrentTimestamp()
    });

    return goal;
  }

  /**
   * Update a goal
   */
  updateGoal(id: string, updates: Partial<Goal>): Goal {
    const index = this.graph.goals.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error(`Goal ${id} not found`);
    }

    const oldGoal = this.graph.goals[index];
    const updated = GoalClass.update(oldGoal, updates);
    this.graph.goals[index] = updated;
    this.graph.updatedAt = getCurrentTimestamp();

    this.eventLogger.logUpdated(updated, oldGoal);
    this.eventEmitter.emit({
      id: `event_${Date.now()}`,
      type: 'goal.updated',
      goalId: id,
      timestamp: getCurrentTimestamp(),
      previousState: oldGoal
    });

    return updated;
  }

  /**
   * Remove a goal
   */
  removeGoal(id: string, removeChildren: boolean = false): void {
    const index = this.graph.goals.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error(`Goal ${id} not found`);
    }

    if (removeChildren) {
      const childIds = this.getChildren(id).map(g => g.id);
      for (const childId of childIds) {
        this.removeGoal(childId, true);
      }
    }

    this.graph.goals.splice(index, 1);
    this.graph.updatedAt = getCurrentTimestamp();
  }

  /**
   * Get a goal by ID
   */
  getGoal(id: string): Goal | undefined {
    return this.graph.goals.find(g => g.id === id);
  }

  /**
   * Complete a goal
   */
  completeGoal(id: string, completedBy?: string): Goal {
    const goal = this.getGoal(id);
    if (!goal) {
      throw new Error(`Goal ${id} not found`);
    }

    const completed = GoalClass.complete(goal, completedBy);
    this.updateGoal(id, completed);

    this.eventLogger.logCompleted(completed, completedBy);
    this.eventEmitter.emit({
      id: `event_${Date.now()}`,
      type: 'goal.completed',
      goalId: id,
      timestamp: getCurrentTimestamp(),
      agentId: completedBy
    });

    return completed;
  }

  /**
   * Abandon a goal
   */
  abandonGoal(id: string, reason?: string): Goal {
    const goal = this.getGoal(id);
    if (!goal) {
      throw new Error(`Goal ${id} not found`);
    }

    const abandoned = GoalClass.abandon(goal, reason);
    this.updateGoal(id, abandoned);

    this.eventLogger.logAbandoned(abandoned, reason, undefined);
    this.eventEmitter.emit({
      id: `event_${Date.now()}`,
      type: 'goal.abandoned',
      goalId: id,
      timestamp: getCurrentTimestamp(),
      data: { reason }
    });

    return abandoned;
  }

  /**
   * Block a goal
   */
  blockGoal(id: string, blockedBy?: string): Goal {
    const goal = this.getGoal(id);
    if (!goal) {
      throw new Error(`Goal ${id} not found`);
    }

    const blocked = GoalClass.block(goal, blockedBy);
    this.updateGoal(id, blocked);

    this.eventLogger.logBlocked(blocked, blockedBy);
    this.eventEmitter.emit({
      id: `event_${Date.now()}`,
      type: 'goal.blocked',
      goalId: id,
      timestamp: getCurrentTimestamp(),
      data: { blockedBy }
    });

    return blocked;
  }

  /**
   * Unblock a goal
   */
  unblockGoal(id: string): Goal {
    const goal = this.getGoal(id);
    if (!goal) {
      throw new Error(`Goal ${id} not found`);
    }

    const unblocked = GoalClass.unblock(goal);
    this.updateGoal(id, unblocked);

    this.eventLogger.logUnblocked(unblocked);
    this.eventEmitter.emit({
      id: `event_${Date.now()}`,
      type: 'goal.unblocked',
      goalId: id,
      timestamp: getCurrentTimestamp()
    });

    return unblocked;
  }

  /**
   * Add dependency
   */
  addDependency(goalId: string, dependency: Dependency): void {
    // Check for cycles
    if (DependencyResolver.wouldCreateCycle(goalId, dependency.targetGoalId, this.graph.goals)) {
      throw new Error(`Adding this dependency would create a cycle: ${goalId} -> ${dependency.targetGoalId}`);
    }

    const goal = this.getGoal(goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }

    const updated = GoalClass.addDependency(goal, dependency);
    this.updateGoal(goalId, updated);

    this.eventLogger.logDependencyAdded(updated, dependency.targetGoalId);
    this.eventEmitter.emit({
      id: `event_${Date.now()}`,
      type: 'goal.dependency_added',
      goalId,
      timestamp: getCurrentTimestamp(),
      data: { dependencyTargetId: dependency.targetGoalId }
    });
  }

  /**
   * Remove dependency
   */
  removeDependency(goalId: string, targetGoalId: string, type?: string): void {
    const goal = this.getGoal(goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }

    const updated = GoalClass.removeDependency(goal, targetGoalId, type);
    this.updateGoal(goalId, updated);

    this.eventLogger.logDependencyRemoved(updated, targetGoalId);
    this.eventEmitter.emit({
      id: `event_${Date.now()}`,
      type: 'goal.dependency_removed',
      goalId,
      timestamp: getCurrentTimestamp(),
      data: { dependencyTargetId: targetGoalId }
    });
  }

  /**
   * Get dependency chain for a goal
   */
  getDependencyChain(goalId: string): Goal[] {
    const goal = this.getGoal(goalId);
    if (!goal) {
      return [];
    }
    return DependencyResolver.getDependencyChain(goal, this.graph.goals);
  }

  /**
   * Get blocking goals
   */
  getBlockers(goalId: string): Goal[] {
    const goal = this.getGoal(goalId);
    if (!goal) {
      return [];
    }
    return DependencyResolver.getBlockers(goal, this.graph.goals);
  }

  /**
   * Get unblocked goals
   */
  getUnblockedGoals(): Goal[] {
    return DependencyResolver.getUnblockedGoals(this.graph.goals);
  }

  /**
   * Detect cycles
   */
  detectCycles(): string[][] | null {
    const cycles = DependencyResolver.detectCycles(this.graph.goals);
    return cycles.length > 0 ? cycles : null;
  }

  /**
   * Get top priorities
   */
  getTopPriorities(n: number = 5): Goal[] {
    return PriorityEngine.getTopPriorities(this.graph.goals, n);
  }

  /**
   * Get goals by status
   */
  getByStatus(status: GoalStatus | GoalStatus[]): Goal[] {
    return QueryEngine.byStatus(this.graph.goals, status);
  }

  /**
   * Get goals by domain
   */
  getByDomain(domain: string): Goal[] {
    return QueryEngine.byDomain(this.graph.goals, domain);
  }

  /**
   * Get goals by time horizon
   */
  getByTimeHorizon(horizon: string): Goal[] {
    return QueryEngine.byTimeHorizon(this.graph.goals, horizon);
  }

  /**
   * Get goals by tag
   */
  getByTag(tag: string): Goal[] {
    return QueryEngine.byTag(this.graph.goals, tag);
  }

  /**
   * Get child goals
   */
  getChildren(goalId: string): Goal[] {
    return QueryEngine.children(this.graph.goals, goalId);
  }

  /**
   * Get descendant goals
   */
  getDescendants(goalId: string): Goal[] {
    return QueryEngine.descendants(this.graph.goals, goalId);
  }

  /**
   * Get root goals
   */
  getRootGoals(): Goal[] {
    return QueryEngine.roots(this.graph.goals);
  }

  /**
   * Query goals with filter
   */
  query(filter: GoalFilter): Goal[] {
    return QueryEngine.query(this.graph.goals, filter).goals;
  }

  /**
   * Grant permission
   */
  grantPermission(agentId: string, permission: Permission): void {
    const updated = PermissionManager.grantPermission(
      agentId,
      permission.capabilities,
      permission.scope,
      this.graph.defaultPermissions
    );

    if (!this.graph.defaultPermissions) {
      this.graph.defaultPermissions = [];
    }

    const index = this.graph.defaultPermissions.findIndex(p => p.agentId === agentId);
    if (index >= 0) {
      this.graph.defaultPermissions[index] = updated;
    } else {
      this.graph.defaultPermissions.push(updated);
    }

    this.graph.updatedAt = getCurrentTimestamp();
  }

  /**
   * Revoke permission
   */
  revokePermission(agentId: string): void {
    if (!this.graph.defaultPermissions) return;
    this.graph.defaultPermissions = PermissionManager.revokeAllPermissions(agentId, this.graph.defaultPermissions);
    this.graph.updatedAt = getCurrentTimestamp();
  }

  /**
   * Get permissions for an agent
   */
  getPermissions(agentId: string): Permission | undefined {
    return PermissionManager.getAgentPermissions(agentId, this.graph.defaultPermissions || []);
  }

  /**
   * Check permission
   */
  checkPermission(agentId: string, capability: string, goalId: string): boolean {
    const goal = this.getGoal(goalId);
    if (!goal) return false;

    const perms = [...(this.graph.defaultPermissions || []), ...(goal.permissions || [])];
    return PermissionManager.hasCapability(agentId, capability as any, goal, perms);
  }

  /**
   * Get goal tree
   */
  getTree(): GoalTreeNode[] {
    const roots = this.getRootGoals();
    return roots.map(root => this.getSubtree(root.id));
  }

  /**
   * Get subtree for a goal
   */
  getSubtree(goalId: string): GoalTreeNode {
    const goal = this.getGoal(goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }

    const children = this.getChildren(goalId);
    const childNodes = children.map(child => this.getSubtree(child.id));

    return {
      goal: deepClone(goal),
      children: childNodes,
      depth: this.calculateDepth(goalId),
      progress: calculateProgress(goal, children)
    };
  }

  /**
   * Move goal under new parent
   */
  moveGoal(goalId: string, newParentId: string | null): void {
    const goal = this.getGoal(goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }

    if (newParentId !== null) {
      const newParent = this.getGoal(newParentId);
      if (!newParent) {
        throw new Error(`Parent goal ${newParentId} not found`);
      }
    }

    this.updateGoal(goalId, { parentId: newParentId });
  }

  /**
   * Convert to JSON
   */
  toJSON(): IntentGraph {
    return deepClone(this.graph);
  }

  /**
   * Convert to JSON string
   */
  toString(): string {
    return Serializer.graphToJSON(this.graph);
  }

  /**
   * Convert to JSON-LD
   */
  toJSONLD(): Record<string, unknown> {
    return Serializer.graphToJSONLD(this.graph);
  }

  /**
   * Event emitter access
   */
  on(eventType: string, handler: (event: any) => void): void {
    this.eventEmitter.on(eventType as any, handler);
  }

  /**
   * Event emitter off
   */
  off(eventType: string, handler: (event: any) => void): void {
    this.eventEmitter.off(eventType as any, handler);
  }

  /**
   * Get history
   */
  getHistory(goalId?: string): any[] {
    const events = this.eventLogger.getAll();
    if (goalId) {
      return events.filter(e => e.goalId === goalId);
    }
    return events;
  }

  /**
   * Merge with another graph
   */
  merge(other: IntentGraphClass, strategy?: MergeStrategy): MergeResult {
    return MergeEngine.merge(this.graph, other.toJSON(), strategy);
  }

  /**
   * Validate graph
   */
  validate(): ValidationResult {
    return this.validator.validateGraph(this.graph);
  }

  /**
   * Get statistics
   */
  getStats(): GraphStats {
    const stats: GraphStats = {
      totalGoals: this.graph.goals.length,
      byStatus: this.countByStatus(),
      byPriority: this.countByPriority(),
      byDomain: this.countByDomain(),
      completionRate: this.getCompletionRate(),
      averageDepth: this.getAverageDepth(),
      orphanedGoals: this.getOrphanedCount()
    };
    return stats;
  }

  /**
   * Get completion rate
   */
  getCompletionRate(): number {
    if (this.graph.goals.length === 0) return 0;
    const completed = this.graph.goals.filter(g => g.status === 'completed').length;
    return completed / this.graph.goals.length;
  }

  /**
   * Get progress of a goal
   */
  getProgress(goalId: string): number {
    const goal = this.getGoal(goalId);
    if (!goal) return 0;

    const children = this.getChildren(goalId);
    return calculateProgress(goal, children);
  }

  /**
   * Private helper methods
   */
  private calculateDepth(goalId: string): number {
    const goal = this.getGoal(goalId);
    if (!goal || !goal.parentId) return 0;

    let depth = 0;
    let current = goal;

    while (current.parentId) {
      depth++;
      current = this.getGoal(current.parentId)!;
    }

    return depth;
  }

  private countByStatus(): Record<string, number> {
    return QueryEngine.countByStatus(this.graph.goals);
  }

  private countByPriority(): Record<string, number> {
    return QueryEngine.countByPriority(this.graph.goals);
  }

  private countByDomain(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const goal of this.graph.goals) {
      if (goal.domain) {
        counts[goal.domain] = (counts[goal.domain] || 0) + 1;
      }
    }
    return counts;
  }

  private getAverageDepth(): number {
    if (this.graph.goals.length === 0) return 0;

    const depths = this.graph.goals.map(g => this.calculateDepth(g.id));
    const sum = depths.reduce((a, b) => a + b, 0);
    return sum / depths.length;
  }

  private getOrphanedCount(): number {
    const goalIds = new Set(this.graph.goals.map(g => g.id));
    return this.graph.goals.filter(g => g.parentId && !goalIds.has(g.parentId)).length;
  }
}
