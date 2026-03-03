# GoalOS

**The Intent Layer for AI Agents**

[![CI](https://github.com/Aimaghsoodi/GoalOS/actions/workflows/ci.yml/badge.svg)](https://github.com/Aimaghsoodi/GoalOS/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
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

### Create Your First Intent Graph

```typescript
import { IntentGraphClass } from '@goalos/core';

// Create a new intent graph
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

### CLI Usage

```bash
npm install -g goalos

goalos init                          # Create a new intent graph
goalos add "Launch business"         # Add a goal
goalos list                          # View all goals as a tree
goalos status                        # Dashboard with priorities & deadlines
goalos update <id> --status active   # Update a goal
goalos complete <id>                 # Mark done
goalos export goals.json             # Export to JSON
goalos serve                         # Start MCP server
```

### MCP Server (for AI Agent Integration)

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

The MCP server exposes 9 tools: `goalos_get_context`, `goalos_list_goals`, `goalos_get_priorities`, `goalos_get_goal`, `goalos_add_goal`, `goalos_update_goal`, `goalos_complete_goal`, `goalos_add_dependency`, `goalos_search`.

---

## Core Concepts

### Goals

A goal is a specific objective with:
- **Status** — `active`, `planned`, `blocked`, `paused`, `completed`, `abandoned`
- **Priority** — `critical`, `high`, `medium`, `low`, `someday` (with numeric scores 0-100)
- **Time horizon** — `today`, `this_week`, `this_month`, `this_quarter`, `this_year`, `long_term`
- **Success criteria** — measurable conditions for "done"
- **Dependencies** — relationships to other goals (`blocks`, `requires`, `enables`, `related`)
- **Permissions** — per-agent access control (`read`, `write`, `complete`, `create_sub_goals`, `reprioritize`)

### Intent Graph

The top-level container holding all your goals. Supports:
- Hierarchical goal trees (parent/child relationships)
- Dependency resolution and cycle detection
- Priority calculation with deadline awareness
- Full-text search across titles, descriptions, tags
- Merge and sync between multiple graph sources

### Permissions

Control what each AI agent can see and do:

```typescript
graph.grantPermission('agent-1', {
  agentId: 'agent-1',
  capabilities: ['read', 'write'],
  scope: { domains: ['work'] }
});
```

---

## Packages

| Package | Description |
|---------|-------------|
| [`@goalos/core`](./packages/goalos-core/) | Core TypeScript library — goals, graphs, queries, merge |
| [`goalos`](./packages/goalos-cli/) | CLI tool — manage intent graphs from the terminal |
| [`@goalos/mcp-server`](./packages/goalos-mcp/) | MCP server — expose intent graphs to AI agents |
| [`goalos` (Python)](./packages/goalos-py/) | Python SDK — mirrors the TypeScript API |

---

## Usage Examples

### Working with Goals

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

// Update it
const updated = GoalClass.update(goal, { status: 'completed' });

// Check deadline
console.log(GoalClass.isOverdue(goal));         // false
console.log(GoalClass.daysUntilDeadline(goal)); // number of days
```

### Querying Goals

```typescript
import { QueryEngine } from '@goalos/core';

const active = QueryEngine.active(goals);
const overdue = QueryEngine.overdue(goals);
const workGoals = QueryEngine.byDomain(goals, 'work');
const urgent = QueryEngine.byPriority(goals, ['critical', 'high']);
const results = QueryEngine.search(goals, 'typescript');

// Complex filters
const filtered = QueryEngine.query(goals, {
  status: ['active', 'planned'],
  domain: 'work',
  priority: ['critical', 'high'],
  hasDeadline: true
});
```

### Priority Engine

```typescript
import { PriorityEngine } from '@goalos/core';

const score = PriorityEngine.calculateScore(goal);     // 0-100
const today = PriorityEngine.getTodaysPriorities(goals);
const week = PriorityEngine.getWeeksPriorities(goals);
const urgent = PriorityEngine.getUrgent(goals);
```

### Dependency Resolution

```typescript
import { DependencyResolver } from '@goalos/core';

const blockers = DependencyResolver.getBlockers(goal, allGoals);
const chain = DependencyResolver.getDependencyChain(goal, allGoals);
const cycles = DependencyResolver.detectCycles(allGoals);
const wouldCycle = DependencyResolver.wouldCreateCycle('goal_a', 'goal_b', allGoals);
```

### Merging Graphs

```typescript
import { MergeEngine } from '@goalos/core';

const result = MergeEngine.merge(localGraph, remoteGraph, 'latest_wins');
// Strategies: 'latest_wins', 'most_restrictive', 'manual'

console.log(result.added);     // new goals
console.log(result.updated);   // changed goals
console.log(result.conflicts); // conflicting changes
```

---

## Development

```bash
git clone https://github.com/Aimaghsoodi/GoalOS.git
cd GoalOS
pnpm install
pnpm build
pnpm test    # 160 tests
```

---

## API Reference

### IntentGraphClass
`create(owner, name?)` · `addGoal(input)` · `updateGoal(id, updates)` · `removeGoal(id)` · `completeGoal(id)` · `abandonGoal(id, reason?)` · `blockGoal(id)` · `unblockGoal(id)` · `addDependency(goalId, dep)` · `getTopPriorities(n?)` · `getByStatus(status)` · `getByDomain(domain)` · `query(filter)` · `getTree()` · `merge(other, strategy?)` · `validate()` · `getStats()` · `toJSON()` · `toString()`

### GoalClass
`create(input)` · `update(goal, updates)` · `complete(goal)` · `abandon(goal, reason?)` · `block(goal)` · `unblock(goal)` · `pause(goal)` · `resume(goal)` · `addDependency(goal, dep)` · `removeDependency(goal, targetId)` · `setPriority(goal, priority)` · `isOverdue(goal)` · `daysUntilDeadline(goal)` · `isComplete(goal)` · `toJSON(goal)` · `fromJSON(json)`

### QueryEngine
`query(goals, filter)` · `byStatus(goals, status)` · `byPriority(goals, priority)` · `byDomain(goals, domain)` · `byTag(goals, tag)` · `search(goals, query)` · `children(goals, parentId)` · `descendants(goals, parentId)` · `roots(goals)` · `overdue(goals)` · `active(goals)` · `completed(goals)`

---

## License

MIT — see [LICENSE](./LICENSE).
