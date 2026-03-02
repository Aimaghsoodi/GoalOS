/**
 * GoalOS Type Definitions
 * Complete interface and type definitions for the intent graph system
 */

/**
 * Goal status enumeration
 */
export type GoalStatus = 'active' | 'planned' | 'blocked' | 'paused' | 'completed' | 'abandoned';

/**
 * Priority level enumeration
 */
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'someday';

/**
 * Time horizon for goal completion
 */
export type TimeHorizon = 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'long_term';

/**
 * Duration units
 */
export type DurationUnit = 'minutes' | 'hours' | 'days' | 'weeks';

/**
 * Dependency relationship types
 */
export type DependencyType = 'blocks' | 'requires' | 'enables' | 'related';

/**
 * Permission capabilities for agents
 */
export type PermissionCapability = 'read' | 'write' | 'complete' | 'create_sub_goals' | 'reprioritize';

/**
 * Event types for goal state changes
 */
export type GoalEventType =
  | 'goal.created'
  | 'goal.updated'
  | 'goal.completed'
  | 'goal.abandoned'
  | 'goal.blocked'
  | 'goal.unblocked'
  | 'goal.prioritized'
  | 'goal.dependency_added'
  | 'goal.dependency_removed'
  | 'goal.permission_granted'
  | 'goal.permission_revoked';

/**
 * Merge strategies for combining intent graphs
 */
export type MergeStrategy = 'latest_wins' | 'manual' | 'most_restrictive';

/**
 * Duration specification
 */
export interface Duration {
  /** Numeric value */
  value: number;
  /** Unit of time */
  unit: DurationUnit;
}

/**
 * Priority specification
 */
export interface Priority {
  /** Priority level */
  level: PriorityLevel;
  /** Optional numeric score (0-100) for sorting */
  score?: number;
  /** Reason for this priority */
  reason?: string;
}

/**
 * Dependency between goals
 */
export interface Dependency {
  /** Type of dependency relationship */
  type: DependencyType;
  /** Target goal ID */
  targetGoalId: string;
  /** Optional description of the dependency */
  description?: string;
}

/**
 * Permission scope constraints
 */
export interface PermissionScope {
  /** Specific goal IDs this permission applies to */
  goalIds?: string[];
  /** Domains this permission applies to */
  domains?: string[];
  /** Maximum depth in goal hierarchy */
  maxDepth?: number;
}

/**
 * Agent permission definition
 */
export interface Permission {
  /** Agent/user ID */
  agentId: string;
  /** Capabilities granted */
  capabilities: PermissionCapability[];
  /** Optional scope constraints */
  scope?: PermissionScope;
}

/**
 * Core Goal interface
 */
export interface Goal {
  /** Unique identifier (nanoid format: goal_...) */
  id: string;
  /** Short, descriptive title */
  title: string;
  /** Longer explanation of the goal */
  description?: string;
  /** Parent goal ID (null = root goal) */
  parentId?: string | null;
  /** Current status of the goal */
  status: GoalStatus;
  /** Priority specification */
  priority: Priority;
  /** Measurable criteria for completion */
  successCriteria?: string[];
  /** ISO 8601 deadline */
  deadline?: string;
  /** Time horizon for completion */
  timeHorizon?: TimeHorizon;
  /** Estimated effort */
  estimatedEffort?: Duration;
  /** Why this goal matters */
  motivation?: string;
  /** Tags for categorization */
  tags?: string[];
  /** Domain: work, personal, health, creative, etc. */
  domain?: string;
  /** Dependencies on other goals */
  dependencies?: Dependency[];
  /** Permissions for agents */
  permissions?: Permission[];
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last updated timestamp */
  updatedAt: string;
  /** ISO 8601 completion timestamp */
  completedAt?: string;
  /** Agent or user that created this goal */
  createdBy?: string;
  /** Schema version for this goal */
  version: number;
  /** Arbitrary metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Intent graph - collection of related goals
 */
export interface IntentGraph {
  /** Unique identifier */
  id: string;
  /** GoalOS spec version */
  version: string;
  /** Owner/user ID */
  owner: string;
  /** Optional name for the graph */
  name?: string;
  /** Optional description */
  description?: string;
  /** All goals in the graph */
  goals: Goal[];
  /** Default permissions for new goals */
  defaultPermissions?: Permission[];
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last updated timestamp */
  updatedAt: string;
  /** Arbitrary metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Goal event in the event log
 */
export interface GoalEvent {
  /** Unique event ID */
  id: string;
  /** Type of event */
  type: GoalEventType;
  /** Target goal ID */
  goalId: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Agent/user that triggered the event */
  agentId?: string;
  /** Event-specific data */
  data?: Record<string, unknown>;
  /** Previous goal state for mutations */
  previousState?: Partial<Goal>;
}

/**
 * Goal filter for querying
 */
export interface GoalFilter {
  /** Filter by status or statuses */
  status?: GoalStatus | GoalStatus[];
  /** Filter by priority level or levels */
  priority?: PriorityLevel | PriorityLevel[];
  /** Filter by domain or domains */
  domain?: string | string[];
  /** Filter by tags (must have all tags) */
  tags?: string[];
  /** Filter by time horizon */
  timeHorizon?: TimeHorizon;
  /** Filter by parent goal ID */
  parentId?: string;
  /** Filter only goals with deadlines */
  hasDeadline?: boolean;
  /** Filter goals with deadline before date (ISO 8601) */
  deadlineBefore?: string;
  /** Filter goals with deadline after date (ISO 8601) */
  deadlineAfter?: string;
  /** Filter goals created after date (ISO 8601) */
  createdAfter?: string;
  /** Filter goals created before date (ISO 8601) */
  createdBefore?: string;
  /** Full-text search on title and description */
  search?: string;
}

/**
 * Goal tree node for hierarchical representation
 */
export interface GoalTreeNode {
  /** The goal object */
  goal: Goal;
  /** Child goals */
  children: GoalTreeNode[];
  /** Depth in tree (0 = root) */
  depth: number;
  /** Completion progress (0-1) */
  progress: number;
}

/**
 * Merge conflict between two versions of a goal
 */
export interface MergeConflict {
  /** ID of the conflicting goal */
  goalId: string;
  /** Field that has the conflict */
  field: string;
  /** Local (current) value */
  localValue: unknown;
  /** Remote (incoming) value */
  remoteValue: unknown;
}

/**
 * Result of merging two intent graphs
 */
export interface MergeResult {
  /** Merged intent graph */
  merged: IntentGraph;
  /** Conflicts that occurred */
  conflicts: MergeConflict[];
  /** Goals added from remote */
  added: Goal[];
  /** Goals updated from remote */
  updated: Goal[];
  /** Goals removed (locally deleted, not in remote) */
  removed: Goal[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error message */
  message: string;
  /** Path to invalid data */
  path?: string;
  /** Optional error data */
  data?: unknown;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning message */
  message: string;
  /** Path to problematic data */
  path?: string;
  /** Optional warning data */
  data?: unknown;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the graph is valid */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
}

/**
 * Graph statistics
 */
export interface GraphStats {
  /** Total number of goals */
  totalGoals: number;
  /** Goals grouped by status */
  byStatus: Record<GoalStatus, number>;
  /** Goals grouped by priority level */
  byPriority: Record<PriorityLevel, number>;
  /** Goals grouped by domain */
  byDomain: Record<string, number>;
  /** Overall completion rate (0-1) */
  completionRate: number;
  /** Average goal hierarchy depth */
  averageDepth: number;
  /** Number of orphaned goals */
  orphanedGoals: number;
}

/**
 * Query result metadata
 */
export interface QueryResult {
  /** Matching goals */
  goals: Goal[];
  /** Total match count */
  total: number;
  /** Query execution time in milliseconds */
  executionTime: number;
}
