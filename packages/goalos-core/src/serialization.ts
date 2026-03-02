/**
 * JSON and JSON-LD serialization/deserialization
 */

import type { Goal, IntentGraph } from './types.js';

/**
 * Serialization utilities for goal objects
 */
export class Serializer {
  /**
   * Convert goal to JSON string
   */
  static goalToJSON(goal: Goal, pretty: boolean = true): string {
    return JSON.stringify(goal, null, pretty ? 2 : undefined);
  }

  /**
   * Parse goal from JSON string
   */
  static goalFromJSON(json: string): Goal {
    return JSON.parse(json) as Goal;
  }

  /**
   * Convert goal to JSON-LD format
   */
  static goalToJSONLD(goal: Goal): Record<string, unknown> {
    return {
      '@context': 'https://schema.goalos.dev/goal-context.jsonld',
      '@type': 'Goal',
      '@id': `goal:${goal.id}`,
      name: goal.title,
      description: goal.description,
      parentId: goal.parentId,
      status: goal.status,
      priority: goal.priority,
      successCriteria: goal.successCriteria,
      deadline: goal.deadline,
      timeHorizon: goal.timeHorizon,
      estimatedEffort: goal.estimatedEffort,
      motivation: goal.motivation,
      tags: goal.tags,
      domain: goal.domain,
      dependencies: goal.dependencies,
      permissions: goal.permissions,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      completedAt: goal.completedAt,
      createdBy: goal.createdBy,
      version: goal.version,
      metadata: goal.metadata
    };
  }

  /**
   * Convert graph to JSON string
   */
  static graphToJSON(graph: IntentGraph, pretty: boolean = true): string {
    return JSON.stringify(graph, null, pretty ? 2 : undefined);
  }

  /**
   * Parse graph from JSON string
   */
  static graphFromJSON(json: string): IntentGraph {
    return JSON.parse(json) as IntentGraph;
  }

  /**
   * Convert graph to JSON-LD format
   */
  static graphToJSONLD(graph: IntentGraph): Record<string, unknown> {
    return {
      '@context': 'https://schema.goalos.dev/graph-context.jsonld',
      '@type': 'IntentGraph',
      '@id': `graph:${graph.id}`,
      name: graph.name,
      description: graph.description,
      version: graph.version,
      owner: graph.owner,
      goals: graph.goals.map(g => this.goalToJSONLD(g)),
      defaultPermissions: graph.defaultPermissions,
      createdAt: graph.createdAt,
      updatedAt: graph.updatedAt,
      metadata: graph.metadata
    };
  }

  /**
   * Convert object to compact JSON
   */
  static compact(obj: unknown): string {
    return JSON.stringify(obj);
  }

  /**
   * Convert object to formatted JSON
   */
  static format(obj: unknown, indent: number = 2): string {
    return JSON.stringify(obj, null, indent);
  }

  /**
   * Export goal as CSV row
   */
  static goalToCSV(goal: Goal): string {
    const fields = [
      goal.id,
      goal.title,
      goal.description || '',
      goal.status,
      goal.priority.level,
      goal.deadline || '',
      goal.parentId || '',
      goal.domain || '',
      goal.tags?.join(';') || '',
      goal.createdAt,
      goal.completedAt || ''
    ];
    return fields.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',');
  }

  /**
   * Export all goals as CSV
   */
  static graphToCSV(graph: IntentGraph): string {
    const header = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Deadline',
      'Parent ID',
      'Domain',
      'Tags',
      'Created At',
      'Completed At'
    ].join(',');

    const rows = graph.goals.map(g => this.goalToCSV(g));
    return [header, ...rows].join('\n');
  }

  /**
   * Clone goal via serialization
   */
  static cloneGoal(goal: Goal): Goal {
    return this.goalFromJSON(this.goalToJSON(goal));
  }

  /**
   * Clone graph via serialization
   */
  static cloneGraph(graph: IntentGraph): IntentGraph {
    return this.graphFromJSON(this.graphToJSON(graph));
  }

  /**
   * Create shallow copy of goal
   */
  static shallowClone(goal: Goal): Goal {
    return { ...goal };
  }

  /**
   * Get size of goal in bytes
   */
  static getGoalSize(goal: Goal): number {
    return new Blob([this.goalToJSON(goal)]).size;
  }

  /**
   * Get size of graph in bytes
   */
  static getGraphSize(graph: IntentGraph): number {
    return new Blob([this.graphToJSON(graph)]).size;
  }

  /**
   * Check if two goals are equal
   */
  static goalsEqual(a: Goal, b: Goal): boolean {
    return this.goalToJSON(a) === this.goalToJSON(b);
  }

  /**
   * Check if two graphs are equal
   */
  static graphsEqual(a: IntentGraph, b: IntentGraph): boolean {
    return this.graphToJSON(a) === this.graphToJSON(b);
  }

  /**
   * Diff two goals
   */
  static diffGoals(a: Goal, b: Goal): Record<string, { old: unknown; new: unknown }> {
    const diff: Record<string, { old: unknown; new: unknown }> = {};

    const keysA = Object.keys(a) as (keyof Goal)[];
    const keysB = new Set(Object.keys(b));

    for (const key of keysA) {
      if (!keysB.has(key)) {
        diff[key] = { old: a[key], new: undefined };
      } else if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
        diff[key] = { old: a[key], new: b[key] };
      }
    }

    for (const key of keysB) {
      if (!keysA.includes(key as keyof Goal)) {
        diff[key] = { old: undefined, new: (b as unknown as Record<string, unknown>)[key] };
      }
    }

    return diff;
  }
}
