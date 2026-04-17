# GoalOS

**The Intent Layer for AI Agents**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-green.svg)](https://www.python.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## What is GoalOS?

GoalOS is a protocol and library that gives AI agents a shared, structured understanding of your goals, intentions, and priorities.

It is **not** memory (facts about you). It is **not** task management (things to do). It is the **intent layer** — a machine-readable graph of what you are trying to achieve, readable and writable by any AI tool.

Most people use multiple AI tools daily. Each one operates in isolation with zero awareness of your bigger picture. Your coding assistant doesn't know you're preparing for a funding round. Your research tool doesn't know you're pivoting domains next month. GoalOS gives every connected tool the same shared context.

---

## Quick Start

### Install

```bash
npm install @goalos/core
```

### Package Entry Points

| Package | Install | Purpose |
|---------|---------|---------|
| `@goalos/core` | `npm install @goalos/core` | Core TypeScript intent graph engine |
| `goalos` | `npm install -g goalos` | CLI for creating, querying, and serving graphs |
| `@goalos/mcp-server` | `npm install -g @goalos/mcp-server` | MCP server for AI tool integrations |
| `goalos` (Python) | `pip install goalos` | Python SDK with Pydantic models |

### Create Your First Intent Graph

```typescript
import { IntentGraphClass } from '@goalos/core';

const graph = IntentGraphClass.create('user@example.com', 'Q1 Goals');

// Add a top-level goal
const business = graph.addGoal({
  title: 'Launch consulting business',
  status: 'active',
  priority: { level: 'critical' },
  domain: 'work',
  deadline: '2026-06-30T23:59:59Z',
  successCriteria: ['First client signed', 'Website live'],
  motivation: 'Financial independence'
});

// Add a sub-goal
const website = graph.addGoal({
  title: 'Build landing page',
  status: 'planned',
  parentId: business.id,
  priority: { level: 'high' },
  tags: ['dev', 'marketing']
});

// Add a dependency
graph.addDependency(business.id, {
  type: 'requires',
  targetGoalId: website.id,
  description: 'Need website before launch'
});

// Query your priorities
const top = graph.getTopPriorities(5);
console.log(top.map(g => g.title));

// Serialize to JSON
const json = graph.toString();
```

### Python

```python
from goalos import GoalManager, IntentGraphManager, Priority

graph = IntentGraphManager.create(owner="user123", name="Launch Plan")
goal = GoalManager.create(
    title="Ship GoalOS Python SDK",
    priority=Priority(level="high", score=85),
    domain="work",
)

graph.add_goal(title=goal.title, priority=goal.priority, domain=goal.domain)

print(f"Goal: {goal.title}")
print(f"Status: {goal.status}")
print(f"Graph goals: {graph.get_stats().totalGoals}")
```

```text
Goal: Ship GoalOS Python SDK
Status: planned
Graph goals: 1
```

---

## Goal Taxonomy

GoalOS provides a structured classification system for goals across six dimensions.

### Statuses

| Status | Icon | Description |
|--------|------|-------------|
| `active` | `●` | Currently being worked on |
| `planned` | `◯` | Defined but not yet started |
| `blocked` | `✗` | Cannot proceed due to dependencies or external factors |
| `paused` | `⏸` | Temporarily suspended |
| `completed` | `✓` | Successfully achieved |
| `abandoned` | `⊘` | Intentionally dropped |

### Priority Levels

| Level | Base Score | Description |
|-------|-----------|-------------|
| `critical` | 95 | Must be done immediately, everything depends on it |
| `high` | 70 | Important, do this week |
| `medium` | 50 | Normal priority |
| `low` | 25 | Do when you have time |
| `someday` | 5 | Nice to have, no urgency |

### Priority Score Adjustments

The priority engine dynamically adjusts scores based on context:

| Condition | Score Adjustment |
|-----------|-----------------|
| Goal is overdue | +20 |
| Deadline within 1 day | +15 |
| Deadline within 7 days | +10 |
| Deadline within 30 days | +5 |
| Status is `active` | +5 |
| Status is `blocked` | -20 |
| Status is `paused` | -15 |

### Time Horizons

| Horizon | Scope |
|---------|-------|
| `today` | Due today or overdue |
| `this_week` | Due within 7 days |
| `this_month` | Due within 30 days |
| `this_quarter` | Due within 90 days |
| `this_year` | Due within 365 days |
| `long_term` | Beyond one year |

### Dependency Types

| Type | Meaning |
|------|---------|
| `requires` | This goal cannot start until the target is completed |
| `blocks` | This goal prevents the target from starting |
| `enables` | Completing this goal unlocks the target |
| `related` | Informational link, no blocking relationship |

### Permission Capabilities

| Capability | Description |
|------------|-------------|
| `read` | View goal details |
| `write` | Modify goal title, description, tags, metadata |
| `complete` | Mark a goal as completed |
| `create_sub_goals` | Add child goals beneath this goal |
| `reprioritize` | Change priority level and score |

---

## Working with Goals

```typescript
import { GoalClass } from '@goalos/core';

// Create a goal
const goal = GoalClass.create({
  title: 'Learn TypeScript',
  status: 'active',
  priority: { level: 'high', reason: 'Career growth' },
  domain: 'learning',
  deadline: '2026-12-31T23:59:59Z',
  successCriteria: ['Build 3 projects', 'Pass certification']
});

// State transitions
const completed = GoalClass.complete(goal);
const blocked = GoalClass.block(goal, 'waiting-on-funding');
const unblocked = GoalClass.unblock(blocked);
const paused = GoalClass.pause(goal);
const resumed = GoalClass.resume(paused);
const abandoned = GoalClass.abandon(goal, 'Pivoting to Rust instead');

// Dependencies
const withDep = GoalClass.addDependency(goal, {
  type: 'requires',
  targetGoalId: 'goal_abc123',
  description: 'Need prerequisite course'
});

// Permissions
const withPerm = GoalClass.addPermission(goal, {
  agentId: 'claude-code',
  capabilities: ['read', 'write', 'complete']
});

// Deadline checks
console.log(GoalClass.isOverdue(goal));         // false
console.log(GoalClass.daysUntilDeadline(goal)); // 300
```

---

## Querying Goals

```typescript
import { QueryEngine } from '@goalos/core';

// Simple filters
const active = QueryEngine.active(goals);
const overdue = QueryEngine.overdue(goals);
const dueToday = QueryEngine.dueToday(goals);
const dueThisWeek = QueryEngine.dueThisWeek(goals);
const workGoals = QueryEngine.byDomain(goals, 'work');
const urgent = QueryEngine.byPriority(goals, ['critical', 'high']);
const results = QueryEngine.search(goals, 'typescript');

// Complex filters with timing
const { goals: filtered, total, executionTime } = QueryEngine.query(goals, {
  status: ['active', 'planned'],
  domain: 'work',
  priority: ['critical', 'high'],
  hasDeadline: true,
  deadlineBefore: '2026-06-01T00:00:00Z'
});

// Hierarchy navigation
const children = QueryEngine.children(goals, parentId);
const descendants = QueryEngine.descendants(goals, parentId);
const ancestors = QueryEngine.ancestors(goals, childId);
const roots = QueryEngine.roots(goals);
const leaves = QueryEngine.leaves(goals);

// Analytics
const byStatus = QueryEngine.countByStatus(goals);     // { active: 5, completed: 12, ... }
const byPriority = QueryEngine.countByPriority(goals);  // { critical: 2, high: 8, ... }
const domains = QueryEngine.distinctDomains(goals);      // ['work', 'health', 'learning']
const tags = QueryEngine.distinctTags(goals);            // ['dev', 'urgent', 'q1']
```

---

## Priority Engine

```typescript
import { PriorityEngine } from '@goalos/core';

// Calculate dynamic priority score (0-100)
const score = PriorityEngine.calculateScore(goal);

// Time-based priority lists
const today = PriorityEngine.getTodaysPriorities(goals);
const week = PriorityEngine.getWeeksPriorities(goals);
const urgent = PriorityEngine.getUrgent(goals);
const top5 = PriorityEngine.getTopPriorities(goals, 5);

// Deadline-aware adjustment
const adjusted = PriorityEngine.adjustForDeadline(goal);
// Returns: { level: 'critical', score: 95, reason: 'Adjusted for deadline' }

// Priority suggestions
const suggestion = PriorityEngine.suggestAdjustment(goal);
if (suggestion) {
  console.log(suggestion.reason);    // "This goal is overdue and should be critical priority"
  console.log(suggestion.suggested); // { level: 'critical', score: 100 }
}

// Priority validation
const { valid, warnings } = PriorityEngine.validatePriority(goal);
// warnings: ["Overdue goals should be critical priority"]

// Distribution analysis
const dist = PriorityEngine.getDistribution(goals);
// { critical: 3, high: 7, medium: 15, low: 8, someday: 2 }
```

---

## Dependency Resolution

```typescript
import { DependencyResolver } from '@goalos/core';

// Relationship queries
const blockers = DependencyResolver.getBlockers(goal, allGoals);
const dependents = DependencyResolver.getDependents(goal, allGoals);
const enablers = DependencyResolver.getEnablers(goal, allGoals);
const related = DependencyResolver.getRelated(goal, allGoals);

// Dependency chain (all transitive dependencies)
const chain = DependencyResolver.getDependencyChain(goal, allGoals);

// Cycle detection
const cycles = DependencyResolver.detectCycles(allGoals);
// Returns: [['goal_a', 'goal_b', 'goal_c', 'goal_a']]

// Cycle prevention
const wouldCycle = DependencyResolver.wouldCreateCycle('goal_a', 'goal_b', allGoals);

// Readiness analysis
const blocked = DependencyResolver.getBlockedGoals(allGoals);
const ready = DependencyResolver.getUnblockedGoals(allGoals);

// Critical path (longest dependency chain)
const criticalPath = DependencyResolver.getCriticalPath(allGoals);
```

---

## Permissions

```typescript
import { PermissionManager } from '@goalos/core';

// Grant permissions with scoping
const readOnly = PermissionManager.grantPermission('agent-1', ['read']);
const fullAccess = PermissionManager.grantPermission('agent-2', ['read', 'write', 'complete']);

// Scoped permissions
const domainScoped = PermissionManager.createDomainScopedPermission(
  'agent-3', ['read', 'write'], ['work', 'finance']
);
const goalScoped = PermissionManager.createGoalScopedPermission(
  'agent-4', ['read'], ['goal_abc', 'goal_def']
);
const depthLimited = PermissionManager.createDepthLimitedPermission(
  'agent-5', ['read'], 2  // Can only see goals up to 2 levels deep
);

// Authorization checks
const canRead = PermissionManager.hasCapability('agent-1', 'read', goal, permissions);
const canWrite = PermissionManager.hasCapability('agent-1', 'write', goal, permissions);
const canComplete = PermissionManager.canCreateSubGoals('agent-2', goal, permissions);

// Permission queries
const readable = PermissionManager.getReadableGoals('agent-1', goals, permissions);
const writable = PermissionManager.getWritableGoals('agent-1', goals, permissions);
const writers = PermissionManager.getAgentsWithCapability('write', permissions);
const summary = PermissionManager.getSummary(permissions);
// { "agent-1": ["read"], "agent-2": ["read", "write", "complete"] }
```

---

## Merging Graphs

```typescript
import { MergeEngine } from '@goalos/core';

// Two-way merge with strategy
const result = MergeEngine.merge(localGraph, remoteGraph, 'latest_wins');
// Strategies: 'latest_wins', 'most_restrictive', 'manual'

console.log(result.added);     // new goals from remote
console.log(result.updated);   // changed goals
console.log(result.conflicts); // conflicting changes needing resolution
console.log(result.summary);   // human-readable merge summary

// Three-way merge (common ancestor)
const threeWay = MergeEngine.threeWayMerge(ancestor, local, remote, 'latest_wins');
```

---

## Validation

```typescript
import { Validator } from '@goalos/core';

const validator = new Validator();

// Validate a single goal
const goalResult = validator.validateGoal(goal);
console.log(goalResult.valid);    // true/false
console.log(goalResult.errors);   // [{ message: '...', path: 'title' }]
console.log(goalResult.warnings); // [{ message: 'Goal deadline is in the past', path: 'deadline' }]

// Validate an entire graph (structural + referential + cyclical + permission checks)
const graphResult = validator.validateGraph(intentGraph);
console.log(validator.getSummary(graphResult));
// Valid: false
// Errors: 2
//   - [goals[3].parentId] Referenced parent goal goal_xyz does not exist
//   - [goals] Circular dependencies detected: goal_a -> goal_b -> goal_a
// Warnings: 1
//   - [goals[0].deadline] Goal deadline is in the past
```

---

## Serialization

```typescript
import { Serializer } from '@goalos/core';

// JSON
const json = Serializer.goalToJSON(goal);
const parsed = Serializer.goalFromJSON(json);

// JSON-LD (linked data)
const jsonld = Serializer.goalToJSONLD(goal);
// { "@context": "https://schema.goalos.dev/...", "@type": "Goal", ... }

// CSV export
const csv = Serializer.graphToCSV(graph);
// ID,Title,Description,Status,Priority,Deadline,...

// Comparison
const equal = Serializer.goalsEqual(goalA, goalB);
const diff = Serializer.diffGoals(goalA, goalB);
// { title: { old: "Learn TS", new: "Master TS" }, status: { old: "planned", new: "active" } }

// Cloning
const clone = Serializer.cloneGoal(goal);
const graphClone = Serializer.cloneGraph(graph);
```

---

## CLI Reference

```bash
npm install -g goalos
```

| Command | Description |
|---------|-------------|
| `goalos init` | Create a new intent graph in the current directory |
| `goalos add "Goal title"` | Add a new goal (`--priority`, `--domain`, `--deadline`, `--parent`) |
| `goalos list` | List all goals in a table |
| `goalos tree` | Display hierarchical goal tree with progress bars |
| `goalos status` | Dashboard with priorities, deadlines, blocked goals |
| `goalos update <id>` | Update a goal (`--status`, `--priority`, `--title`, `--deadline`) |
| `goalos complete <id>` | Mark a goal as completed |
| `goalos block <id>` | Mark a goal as blocked |
| `goalos validate` | Validate the intent graph for errors and warnings |
| `goalos prioritize` | Interactive priority review and adjustment |
| `goalos export <file>` | Export graph to JSON file |
| `goalos import <file>` | Import graph from JSON file |
| `goalos serve` | Start the MCP server for AI agent integration |

---

## MCP Server (AI Agent Integration)

Add to your AI tool's MCP configuration:

```json
{
  "mcpServers": {
    "goalos": {
      "command": "npx",
      "args": ["@goalos/mcp-server"]
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `goalos_get_context` | Get summary: active goals, priorities, blocked items, deadlines, completion rate |
| `goalos_list_goals` | List goals with filtering by status, priority, domain. Returns hierarchical tree |
| `goalos_get_priorities` | Top N priority goals, optionally filtered by time horizon |
| `goalos_get_goal` | Full details of one goal including children, blockers, progress, history |
| `goalos_add_goal` | Add a new goal with title, priority, domain, deadline, success criteria |
| `goalos_update_goal` | Update goal details, status, priority, deadline |
| `goalos_complete_goal` | Mark goal done, auto-update parent progress |
| `goalos_add_dependency` | Add dependency between goals (requires, blocks, enables, related) |
| `goalos_search` | Full-text search across titles, descriptions, tags |

The MCP server supports both file-based (JSON) and SQLite storage backends.

---

## Packages

| Package | Description |
|---------|-------------|
| [`@goalos/core`](./packages/goalos-core/) | Core TypeScript library — goals, graphs, queries, priority, dependencies, merge, validation, permissions, serialization |
| [`goalos`](./packages/goalos-cli/) | CLI tool — manage intent graphs from the terminal with colored output, trees, dashboards |
| [`@goalos/mcp-server`](./packages/goalos-mcp/) | MCP server — expose intent graphs to AI agents via 9 tools |
| [`goalos` (Python)](./packages/goalos-py/) | Python SDK — mirrors the TypeScript API with Pydantic models |

---

## Development

```bash
git clone https://github.com/Aimaghsoodi/GoalOS.git
cd GoalOS
pnpm install
pnpm build
pnpm lint
pnpm typecheck
pnpm test

cd packages/goalos-py
uv run --extra dev pytest
```

### Windows Note

If you are developing from a Windows network share, use a mapped drive and the repo-level `.npmrc` hoisted linker. The default pnpm symlink layout is fragile on UNC-backed workspaces.

### Maintainers

- Contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Release guide: [RELEASE.md](./RELEASE.md)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)

---

## API Reference

### IntentGraphClass
`create(owner, name?)` · `fromJSON(data)` · `addGoal(input)` · `updateGoal(id, updates)` · `removeGoal(id)` · `getGoal(id)` · `completeGoal(id, completedBy?)` · `abandonGoal(id, reason?)` · `blockGoal(id)` · `unblockGoal(id)` · `addDependency(goalId, dep)` · `getTopPriorities(n?)` · `getByStatus(status)` · `getByDomain(domain)` · `getByTimeHorizon(horizon)` · `getChildren(id)` · `getBlockers(id)` · `getProgress(id)` · `getHistory(id)` · `query(filter)` · `getTree()` · `getStats()` · `merge(other, strategy?)` · `validate()` · `grantPermission(agentId, permission)` · `toJSON()` · `toString()`

### GoalClass
`create(input)` · `update(goal, updates)` · `complete(goal, completedBy?)` · `abandon(goal, reason?)` · `block(goal, blockedBy?)` · `unblock(goal)` · `pause(goal)` · `resume(goal)` · `addDependency(goal, dep)` · `removeDependency(goal, targetId, type?)` · `addPermission(goal, permission)` · `removePermission(goal, agentId)` · `setPriority(goal, priority)` · `isOverdue(goal)` · `daysUntilDeadline(goal)` · `isComplete(goal)` · `toJSON(goal)` · `fromJSON(json)`

### QueryEngine
`query(goals, filter)` · `matches(goal, filter)` · `byStatus(goals, status)` · `byPriority(goals, priority)` · `byDomain(goals, domain)` · `byTag(goals, tag)` · `byTimeHorizon(goals, horizon)` · `search(goals, query)` · `active(goals)` · `completed(goals)` · `blocked(goals)` · `planned(goals)` · `overdue(goals)` · `dueToday(goals)` · `dueThisWeek(goals)` · `dueThisMonth(goals)` · `withDeadline(goals)` · `children(goals, parentId)` · `parent(goals, childId)` · `descendants(goals, parentId)` · `ancestors(goals, childId)` · `roots(goals)` · `leaves(goals)` · `recentlyCreated(goals, days)` · `distinctDomains(goals)` · `distinctTags(goals)` · `countByStatus(goals)` · `countByPriority(goals)` · `sortByCreated(goals, asc?)` · `sortByDeadline(goals, asc?)`

### PriorityEngine
`calculateScore(goal)` · `setPriority(goal, level, reason?)` · `adjustForDeadline(goal)` · `getTopPriorities(goals, count?)` · `rankAll(goals)` · `getTodaysPriorities(goals)` · `getWeeksPriorities(goals)` · `getUrgent(goals)` · `compare(goalA, goalB)` · `getDistribution(goals)` · `validatePriority(goal)` · `suggestAdjustment(goal)`

### DependencyResolver
`getDependencies(goal, goals)` · `getDependents(goal, goals)` · `getBlockers(goal, goals)` · `getEnablers(goal, goals)` · `getRelated(goal, goals)` · `getDependencyChain(goal, goals)` · `detectCycles(goals)` · `wouldCreateCycle(sourceId, targetId, goals)` · `getBlockedGoals(goals)` · `getUnblockedGoals(goals)` · `getCriticalPath(goals)` · `validateDependencies(goals)`

### MergeEngine
`merge(local, remote, strategy?)` · `threeWayMerge(ancestor, local, remote, strategy?)`

### PermissionManager
`hasCapability(agentId, capability, goal, permissions)` · `grantPermission(agentId, capabilities, scope?)` · `revokeAllPermissions(agentId, permissions)` · `revokeCapability(agentId, capability, permissions)` · `addCapabilities(agentId, capabilities, permissions)` · `getReadableGoals(agentId, goals, permissions)` · `getWritableGoals(agentId, goals, permissions)` · `getCompletableGoals(agentId, goals, permissions)` · `canCreateSubGoals(agentId, goal, permissions)` · `canReprioritize(agentId, goal, permissions)` · `createDomainScopedPermission(agentId, capabilities, domains)` · `createGoalScopedPermission(agentId, capabilities, goalIds)` · `createDepthLimitedPermission(agentId, capabilities, maxDepth)` · `getAgentsWithCapability(capability, permissions)` · `getAgentPermissions(agentId, permissions)` · `getSummary(permissions)` · `validatePermission(permission)`

### Validator
`validateGoal(goal)` · `validateGraph(graph)` · `validateField(goal, fieldName)` · `getSummary(result)`

### Serializer
`goalToJSON(goal, pretty?)` · `goalFromJSON(json)` · `goalToJSONLD(goal)` · `graphToJSON(graph, pretty?)` · `graphFromJSON(json)` · `graphToJSONLD(graph)` · `graphToCSV(graph)` · `goalToCSV(goal)` · `cloneGoal(goal)` · `cloneGraph(graph)` · `diffGoals(a, b)` · `goalsEqual(a, b)` · `graphsEqual(a, b)` · `getGoalSize(goal)` · `getGraphSize(graph)`

---

## License

MIT — see [LICENSE](./LICENSE).
