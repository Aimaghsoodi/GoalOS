/**
 * GoalOS Core - Public API exports
 */

// Type exports
export type {
  Goal,
  IntentGraph,
  GoalStatus,
  PriorityLevel,
  TimeHorizon,
  DurationUnit,
  DependencyType,
  PermissionCapability,
  GoalEventType,
  MergeStrategy,
  Duration,
  Priority,
  Dependency,
  PermissionScope,
  Permission,
  GoalEvent,
  GoalFilter,
  GoalTreeNode,
  MergeConflict,
  MergeResult,
  ValidationError,
  ValidationWarning,
  ValidationResult,
  GraphStats,
  QueryResult
} from './types.js';

// Class exports
export { GoalClass } from './goal.js';
export { IntentGraphClass } from './intent-graph.js';
export { DependencyResolver } from './dependency.js';
export { PriorityEngine } from './priority.js';
export { PermissionManager } from './permissions.js';
export { EventEmitter, EventLogger } from './events.js';
export { Serializer } from './serialization.js';
export { Validator } from './validation.js';
export { QueryEngine } from './query.js';
export { MergeEngine } from './merge.js';

// Utility exports
export {
  generateGoalId,
  generateEventId,
  generateGraphId,
  getCurrentTimestamp,
  parseISODate,
  isValidISODate,
  isValidGoalId,
  deepClone,
  calculateProgress,
  sortByPriority,
  isOverdue,
  daysUntilDeadline,
  validateGoalStructure,
  buildGoalMap,
  getAncestorIds,
  getDescendantIds,
  isAncestor,
  getGoalAge
} from './utils.js';
