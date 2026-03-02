# @goalos/core

Core library for GoalOS - structured intent graphs for AI agent alignment.

## What is @goalos/core?

This is the core library implementing the GoalOS specification with:

- Goal class - Create, update, delete, and manage individual goals
- IntentGraph class - Container for all goals with CRUD, querying, dependency resolution
- Dependency resolution - Track dependencies, detect cycles, find blockers
- Priority engine - Calculate and rank goal priorities
- Permissions system - Fine-grained control over what agents can do
- Events - Emit events when goals change, with audit trail
- Serialization - Convert to/from JSON-LD format
- Validation - Schema validation using JSON Schema

## Installation

npm install @goalos/core

## Quick Start

import { IntentGraph } from "@goalos/core";

const graph = IntentGraph.create("user@example.com", "2024 Goals");

const goal = graph.addGoal({
  title: "Launch AI consulting business",
  priority: { level: "critical" },
  timeHorizon: "this_quarter",
  successCriteria: ["First client contract signed"],
});

const website = graph.addGoal({
  title: "Build landing page",
  parentId: goal.id,
  priority: { level: "high" },
});

graph.addDependency(goal.id, {
  type: "requires",
  targetGoalId: website.id,
});

const priorities = graph.getTopPriorities(5);
await graph.toFile("goals.json");

## API Overview

IntentGraph Methods:
- create(owner, name) - Create new graph
- addGoal(input) - Add goal
- updateGoal(id, updates) - Update goal
- removeGoal(id) - Delete goal
- getGoal(id) - Fetch goal
- completeGoal(id) - Mark done
- getTopPriorities(n) - Get top N goals
- getByStatus(status) - Filter by status
- getByDomain(domain) - Filter by domain
- getChildren(goalId) - Get sub-goals
- getDescendants(goalId) - Get all descendants
- addDependency(goalId, dep) - Link goals
- detectCycles() - Find circular dependencies
- grantPermission(agentId, perm) - Control access
- checkPermission(agentId, capability, goalId) - Check access
- toFile(path) - Save to file
- fromFile(path) - Load from file
- toJSON() - Serialize
- on(event, handler) - Listen for changes
- getHistory() - Audit trail
- merge(other) - Merge two graphs

## Goal Type

interface Goal {
  id: string;
  title: string;
  description?: string;
  parentId?: string;
  status: GoalStatus;
  priority: Priority;
  successCriteria?: string[];
  deadline?: string;
  timeHorizon?: TimeHorizon;
  estimatedEffort?: Duration;
  motivation?: string;
  tags?: string[];
  domain?: string;
  dependencies?: Dependency[];
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  version: number;
  metadata?: Record<string, unknown>;
}

## Examples

### Hierarchical Goals

const q1 = graph.addGoal({ title: "Q1 Objectives" });
const business = graph.addGoal({
  title: "Launch business",
  parentId: q1.id,
});
const website = graph.addGoal({
  title: "Build landing page",
  parentId: business.id,
});

const tree = graph.getTree();

### Permissions

graph.grantPermission("claude", {
  agentId: "claude",
  capabilities: ["read", "complete"],
  scope: { domains: ["work"] },
});

if (graph.checkPermission("claude", "complete", goalId)) {
  graph.completeGoal(goalId);
}

### Events

graph.on("goal.completed", (event) => {
  console.log(`Goal completed: ${event.goalId}`);
});

const history = graph.getHistory();

### Merging Graphs

const local = await IntentGraph.fromFile("local.json");
const remote = await IntentGraph.fromFile("remote.json");
const { merged, conflicts } = local.merge(remote, "latest_wins");

## Testing

npm test
npm run test:watch
npm run test:coverage

Coverage: >80% including edge cases, permissions, conflicts.

## Documentation

- Main README
- GoalOS Specification (spec/goalos-spec-v0.1.md)
- Quickstart Guide (spec/goalos-quickstart.md)

## License

MIT - See LICENSE
