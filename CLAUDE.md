# GOALOS — Complete Build Prompt

You are building **GoalOS** — a protocol and platform that gives AI agents a shared, structured understanding of a human's goals, intentions, and priorities. This is NOT memory (facts about a user). This is NOT task management (things to do). This is the **intent layer** — a machine-readable graph of what someone is trying to achieve, readable and writable by any AI tool.

You are building this as a production-ready, publishable open-source project. Every package must be fully functional, tested, documented, and ready for npm/PyPI publishing.

**GitHub:** github.com/AbtinDev/goalos
**Part of the OpenClaw ecosystem** (sovereign AI agents on client infrastructure).

---

## PROJECT STRUCTURE

```
goalos/
├── README.md                          # Project overview, quickstart, badges
├── LICENSE                            # MIT License
├── CONTRIBUTING.md                    # Contribution guidelines
├── CHANGELOG.md                      # Version history
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # CI: lint, test, build on every PR
│   │   ├── publish-npm.yml           # Publish to npm on tag
│   │   └── publish-pypi.yml          # Publish to PyPI on tag
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
│
├── spec/                              # The GoalOS Specification
│   ├── README.md                     # Spec overview
│   ├── goalos-spec-v0.1.md           # Full specification document
│   ├── schema/
│   │   ├── goal.schema.json          # JSON Schema for Goal objects
│   │   ├── intent-graph.schema.json  # JSON Schema for full intent graphs
│   │   ├── permission.schema.json    # JSON Schema for permissions
│   │   └── event.schema.json         # JSON Schema for goal events
│   └── examples/
│       ├── personal-project.json     # Example: launching a side business
│       ├── team-sprint.json          # Example: engineering sprint goals
│       ├── career-transition.json    # Example: changing careers
│       ├── content-creator.json      # Example: content creation pipeline
│       └── health-fitness.json       # Example: health goals
│
├── packages/
│   ├── goalos-core/                  # Core TypeScript library
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   ├── src/
│   │   │   ├── index.ts              # Public API exports
│   │   │   ├── types.ts              # All TypeScript interfaces/types
│   │   │   ├── goal.ts               # Goal class — create, update, complete, archive
│   │   │   ├── intent-graph.ts       # IntentGraph class — the core data structure
│   │   │   ├── dependency.ts         # Dependency resolution & cycle detection
│   │   │   ├── priority.ts           # Priority calculation engine
│   │   │   ├── permissions.ts        # Permission scoping for agents
│   │   │   ├── events.ts             # Event system for goal changes
│   │   │   ├── serialization.ts      # JSON-LD serialization/deserialization
│   │   │   ├── validation.ts         # Schema validation using Ajv
│   │   │   ├── query.ts              # Query/filter goals by status, priority, etc.
│   │   │   ├── merge.ts              # Merge/sync intent graphs from multiple sources
│   │   │   └── utils.ts              # ID generation, timestamps, helpers
│   │   └── tests/
│   │       ├── goal.test.ts
│   │       ├── intent-graph.test.ts
│   │       ├── dependency.test.ts
│   │       ├── priority.test.ts
│   │       ├── permissions.test.ts
│   │       ├── events.test.ts
│   │       ├── serialization.test.ts
│   │       ├── validation.test.ts
│   │       ├── query.test.ts
│   │       ├── merge.test.ts
│   │       └── fixtures/             # Test fixtures (sample intent graphs)
│   │           ├── valid-graph.json
│   │           ├── complex-graph.json
│   │           ├── invalid-graph.json
│   │           └── merge-conflict.json
│   │
│   ├── goalos-mcp/                   # MCP Server for AI agent integration
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts              # MCP server entry point
│   │   │   ├── server.ts             # MCP server setup with stdio transport
│   │   │   ├── tools.ts              # Tool definitions
│   │   │   ├── handlers.ts           # Tool call handlers
│   │   │   ├── storage.ts            # Storage interface
│   │   │   ├── storage-file.ts       # File-based storage implementation
│   │   │   ├── storage-sqlite.ts     # SQLite storage implementation
│   │   │   └── config.ts             # Server configuration
│   │   └── tests/
│   │       ├── server.test.ts
│   │       ├── tools.test.ts
│   │       └── storage.test.ts
│   │
│   ├── goalos-cli/                   # CLI tool for managing intent graphs
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts              # CLI entry point (#!/usr/bin/env node)
│   │   │   ├── commands/
│   │   │   │   ├── init.ts
│   │   │   │   ├── add.ts
│   │   │   │   ├── list.ts
│   │   │   │   ├── update.ts
│   │   │   │   ├── complete.ts
│   │   │   │   ├── prioritize.ts
│   │   │   │   ├── status.ts
│   │   │   │   ├── export.ts
│   │   │   │   ├── import.ts
│   │   │   │   ├── serve.ts
│   │   │   │   └── visualize.ts
│   │   │   ├── display.ts
│   │   │   └── config.ts
│   │   └── tests/
│   │       ├── commands/
│   │       │   ├── init.test.ts
│   │       │   ├── add.test.ts
│   │       │   ├── list.test.ts
│   │       │   └── complete.test.ts
│   │       └── display.test.ts
│   │
│   └── goalos-py/                    # Python SDK
│       ├── pyproject.toml
│       ├── goalos/
│       │   ├── __init__.py
│       │   ├── types.py
│       │   ├── graph.py
│       │   ├── goal.py
│       │   ├── priority.py
│       │   ├── permissions.py
│       │   ├── serialization.py
│       │   ├── validation.py
│       │   ├── query.py
│       │   └── client.py
│       └── tests/
│           ├── test_graph.py
│           ├── test_goal.py
│           ├── test_priority.py
│           ├── test_serialization.py
│           └── conftest.py
│
├── website/
│   ├── index.html
│   ├── docs/
│   │   ├── quickstart.md
│   │   ├── spec.md
│   │   ├── mcp-integration.md
│   │   ├── cli-reference.md
│   │   └── python-sdk.md
│   └── blog/
│       └── manifesto.md
│
└── examples/
    ├── claude-desktop-integration/
    │   ├── README.md
    │   └── claude_desktop_config.json
    ├── langchain-integration/
    │   ├── README.md
    │   └── goalos_langchain.py
    ├── crewai-integration/
    │   ├── README.md
    │   └── goalos_crewai.py
    └── cloudflare-worker/
        ├── README.md
        ├── wrangler.toml
        └── src/index.ts
```

---

## DETAILED TECHNICAL SPECIFICATIONS

### 1. CORE DATA TYPES (packages/goalos-core/src/types.ts)

```typescript
// === GOAL ===
export interface Goal {
  id: string;                          // nanoid, e.g., "goal_V1StGXR8"
  title: string;                       // Short, descriptive title
  description?: string;                // Longer explanation
  parentId?: string;                   // Parent goal ID (null = root goal)
  status: GoalStatus;
  priority: Priority;
  successCriteria?: string[];          // Measurable criteria for "done"
  deadline?: string;                   // ISO 8601 datetime
  timeHorizon?: TimeHorizon;
  estimatedEffort?: Duration;
  motivation?: string;                 // WHY this matters
  tags?: string[];
  domain?: string;                     // work, personal, health, creative, etc.
  dependencies?: Dependency[];
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy?: string;                  // Agent or user that created this
  version: number;
  metadata?: Record<string, unknown>;
}

export type GoalStatus = 'active' | 'planned' | 'blocked' | 'paused' | 'completed' | 'abandoned';

export interface Priority {
  level: PriorityLevel;
  score?: number;                      // 0-100 numeric for sorting
  reason?: string;
}

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'someday';
export type TimeHorizon = 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'long_term';

export interface Duration {
  value: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
}

// === DEPENDENCIES ===
export interface Dependency {
  type: DependencyType;
  targetGoalId: string;
  description?: string;
}

export type DependencyType = 'blocks' | 'requires' | 'enables' | 'related';

// === PERMISSIONS ===
export interface Permission {
  agentId: string;
  capabilities: PermissionCapability[];
  scope?: PermissionScope;
}

export type PermissionCapability = 'read' | 'write' | 'complete' | 'create_sub_goals' | 'reprioritize';

export interface PermissionScope {
  goalIds?: string[];
  domains?: string[];
  maxDepth?: number;
}

// === INTENT GRAPH ===
export interface IntentGraph {
  id: string;
  version: string;                     // Spec version "0.1.0"
  owner: string;
  name?: string;
  description?: string;
  goals: Goal[];
  defaultPermissions?: Permission[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

// === EVENTS ===
export interface GoalEvent {
  id: string;
  type: GoalEventType;
  goalId: string;
  timestamp: string;
  agentId?: string;
  data?: Record<string, unknown>;
  previousState?: Partial<Goal>;
}

export type GoalEventType =
  | 'goal.created' | 'goal.updated' | 'goal.completed' | 'goal.abandoned'
  | 'goal.blocked' | 'goal.unblocked' | 'goal.prioritized'
  | 'goal.dependency_added' | 'goal.dependency_removed'
  | 'goal.permission_granted' | 'goal.permission_revoked';
```

### 2. INTENT GRAPH CLASS API (packages/goalos-core/src/intent-graph.ts)

```typescript
class IntentGraph {
  // === Construction ===
  static create(owner: string, name?: string): IntentGraph;
  static fromJSON(json: string | object): IntentGraph;
  static fromFile(path: string): Promise<IntentGraph>;

  // === Goal CRUD ===
  addGoal(input: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Goal;
  updateGoal(id: string, updates: Partial<Goal>): Goal;
  removeGoal(id: string, removeChildren?: boolean): void;
  getGoal(id: string): Goal | undefined;

  // === Status transitions ===
  completeGoal(id: string, completedBy?: string): Goal;
  abandonGoal(id: string, reason?: string): Goal;
  blockGoal(id: string, blockedBy: string): Goal;
  unblockGoal(id: string): Goal;

  // === Dependencies ===
  addDependency(goalId: string, dependency: Dependency): void;
  removeDependency(goalId: string, targetGoalId: string): void;
  getDependencyChain(goalId: string): Goal[];
  getBlockers(goalId: string): Goal[];
  getUnblockedGoals(): Goal[];
  detectCycles(): string[][] | null;

  // === Queries ===
  getTopPriorities(n?: number): Goal[];
  getByStatus(status: GoalStatus): Goal[];
  getByDomain(domain: string): Goal[];
  getByTimeHorizon(horizon: TimeHorizon): Goal[];
  getByTag(tag: string): Goal[];
  getChildren(goalId: string): Goal[];
  getDescendants(goalId: string): Goal[];
  getRootGoals(): Goal[];
  query(filter: GoalFilter): Goal[];

  // === Permissions ===
  grantPermission(agentId: string, permission: Permission): void;
  revokePermission(agentId: string): void;
  getPermissions(agentId: string): Permission | undefined;
  checkPermission(agentId: string, capability: PermissionCapability, goalId: string): boolean;

  // === Tree ===
  getTree(): GoalTreeNode[];
  getSubtree(goalId: string): GoalTreeNode;
  moveGoal(goalId: string, newParentId: string | null): void;

  // === Serialization ===
  toJSON(): object;
  toJSONLD(): object;
  toString(): string;
  toFile(path: string): Promise<void>;

  // === Events ===
  on(event: GoalEventType, handler: (event: GoalEvent) => void): void;
  off(event: GoalEventType, handler: (event: GoalEvent) => void): void;
  getHistory(goalId?: string): GoalEvent[];

  // === Merge ===
  merge(other: IntentGraph, strategy?: MergeStrategy): MergeResult;

  // === Validation ===
  validate(): ValidationResult;

  // === Stats ===
  getStats(): GraphStats;
  getCompletionRate(): number;
  getProgress(goalId: string): number;
}

interface GoalFilter {
  status?: GoalStatus | GoalStatus[];
  priority?: PriorityLevel | PriorityLevel[];
  domain?: string | string[];
  tags?: string[];
  timeHorizon?: TimeHorizon;
  parentId?: string;
  hasDeadline?: boolean;
  deadlineBefore?: string;
  deadlineAfter?: string;
  createdAfter?: string;
  createdBefore?: string;
  search?: string;
}

interface GoalTreeNode { goal: Goal; children: GoalTreeNode[]; depth: number; progress: number; }
type MergeStrategy = 'latest_wins' | 'manual' | 'most_restrictive';
interface MergeResult { merged: IntentGraph; conflicts: MergeConflict[]; added: Goal[]; updated: Goal[]; removed: Goal[]; }
interface MergeConflict { goalId: string; field: string; localValue: unknown; remoteValue: unknown; }
interface ValidationResult { valid: boolean; errors: ValidationError[]; warnings: ValidationWarning[]; }
interface GraphStats { totalGoals: number; byStatus: Record<GoalStatus, number>; byPriority: Record<PriorityLevel, number>; byDomain: Record<string, number>; completionRate: number; averageDepth: number; orphanedGoals: number; }
```

### 3. MCP SERVER TOOLS (packages/goalos-mcp/src/tools.ts)

Expose these 9 MCP tools:

| Tool Name | Description | Key Parameters |
|-----------|-------------|----------------|
| `goalos_get_context` | Get summary of user's current priorities, active goals, deadlines, blocked items. **Call this FIRST every session.** | none |
| `goalos_list_goals` | List all goals, filtered by status/priority/domain. Returns hierarchical tree. | `status?`, `priority?`, `domain?`, `include_completed?` |
| `goalos_get_priorities` | Top N priority goals for a time horizon. | `count?` (default 5), `time_horizon?` |
| `goalos_get_goal` | Full details of one goal with sub-goals and dependencies. | `goal_id` (required) |
| `goalos_add_goal` | Add a new goal. | `title` (required), `description?`, `parent_id?`, `priority?`, `domain?`, `deadline?`, `time_horizon?`, `success_criteria?`, `motivation?`, `tags?` |
| `goalos_update_goal` | Update goal details, status, or priority. | `goal_id` (required), any updatable fields |
| `goalos_complete_goal` | Mark goal done. Auto-updates parent progress and unblocks dependents. | `goal_id` (required), `notes?` |
| `goalos_add_dependency` | Add dependency between goals. | `goal_id` (required), `depends_on` (required), `type?` |
| `goalos_search` | Full-text search across titles, descriptions, tags. | `query` (required), `status?` |

Use `@modelcontextprotocol/sdk` with **stdio transport**. Storage: file-based JSON by default at `~/.goalos/graph.json`, with optional SQLite via `--storage sqlite`.

### 4. CLI SPECIFICATION (packages/goalos-cli/)

```
Usage: goalos <command> [options]

Commands:
  init                    Create new intent graph in current directory
  add <title>             Add a new goal
  list                    Show all goals as a tree
  status                  Dashboard: priorities, deadlines, progress
  update <id>             Update a goal
  complete <id>           Mark a goal as done
  block <id> --by <id>    Mark goal as blocked
  prioritize              Interactive priority setting (inquirer prompts)
  tree                    Full goal tree with dependencies
  export [file]           Export intent graph to JSON
  import <file>           Import intent graph from JSON
  serve                   Start GoalOS MCP server
  validate                Validate the intent graph

Options:
  --format <json|tree|table>   Output format (default: tree)
  --domain <domain>            Filter by domain
  --status <status>            Filter by status
  --priority <level>           Filter by priority
  --config <path>              Config file (default: ~/.goalos/config.json)
```

Use: `commander` (CLI parsing), `chalk` (colors), `cli-table3` (tables), `boxen` (dashboard), `inquirer` (interactive prompts).

### 5. PYTHON SDK (packages/goalos-py/)

```toml
# pyproject.toml
[project]
name = "goalos"
version = "0.1.0"
description = "GoalOS Python SDK — The personal AI intent graph"
requires-python = ">=3.9"
license = {text = "MIT"}
dependencies = ["pydantic>=2.0", "httpx>=0.24", "jsonschema>=4.0"]

[project.optional-dependencies]
dev = ["pytest>=7.0", "pytest-asyncio", "ruff"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

Mirror the TypeScript API exactly with Pydantic models and equivalent methods.

### 6. JSON SCHEMAS (spec/schema/)

Create full JSON Schema drafts for:
- **goal.schema.json** — validate Goal objects. id pattern: `^goal_[a-zA-Z0-9]+$`, required fields: id, title, status, priority, createdAt, updatedAt, version. All timestamps ISO 8601.
- **intent-graph.schema.json** — validate full graphs including referential integrity.
- **permission.schema.json** — validate permission objects.
- **event.schema.json** — validate goal events.

### 7. EXAMPLE INTENT GRAPHS (spec/examples/)

Create 5 realistic examples:
1. **personal-project.json** — Launching an AI business (root: "Launch OpenClaw", sub-goals: landing page, manifesto, payments, outreach, with dependencies and deadlines)
2. **team-sprint.json** — Engineering team sprint (shared goals, multiple assignees)
3. **career-transition.json** — Data scientist to AI entrepreneur
4. **content-creator.json** — Multi-platform content pipeline
5. **health-fitness.json** — Health goals with measurable success criteria

---

## PACKAGE CONFIGURATIONS

### Monorepo: pnpm workspaces
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

### Root package.json
```json
{
  "name": "goalos",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  }
}
```

### goalos-core/package.json
```json
{
  "name": "@goalos/core",
  "version": "0.1.0",
  "description": "GoalOS core library — structured intent graphs for AI agent alignment",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": { ".": { "import": "./dist/index.mjs", "require": "./dist/index.js", "types": "./dist/index.d.ts" } },
  "scripts": { "build": "tsup src/index.ts --format cjs,esm --dts", "test": "vitest run", "test:watch": "vitest", "lint": "eslint src/", "typecheck": "tsc --noEmit" },
  "keywords": ["ai", "agents", "goals", "intent", "mcp", "llm"],
  "license": "MIT",
  "dependencies": { "ajv": "^8.12.0", "nanoid": "^5.0.0" },
  "devDependencies": { "tsup": "^8.0.0", "typescript": "^5.3.0", "vitest": "^1.0.0", "eslint": "^8.50.0", "@typescript-eslint/parser": "^6.0.0", "@typescript-eslint/eslint-plugin": "^6.0.0" }
}
```

### goalos-mcp/package.json
```json
{
  "name": "@goalos/mcp-server",
  "version": "0.1.0",
  "description": "GoalOS MCP server — expose intent graphs to AI agents",
  "bin": { "goalos-mcp": "dist/index.js" },
  "scripts": { "build": "tsup src/index.ts --format cjs --dts", "start": "node dist/index.js", "dev": "tsx src/index.ts", "test": "vitest run" },
  "license": "MIT",
  "dependencies": { "@modelcontextprotocol/sdk": "^1.0.0", "@goalos/core": "workspace:*", "better-sqlite3": "^11.0.0" },
  "devDependencies": { "tsup": "^8.0.0", "tsx": "^4.0.0", "typescript": "^5.3.0", "vitest": "^1.0.0" }
}
```

### goalos-cli/package.json
```json
{
  "name": "goalos",
  "version": "0.1.0",
  "description": "GoalOS CLI — manage your personal AI intent graph",
  "bin": { "goalos": "dist/index.js" },
  "scripts": { "build": "tsup src/index.ts --format cjs", "dev": "tsx src/index.ts", "test": "vitest run" },
  "license": "MIT",
  "dependencies": { "@goalos/core": "workspace:*", "commander": "^12.0.0", "chalk": "^5.3.0", "cli-table3": "^0.6.0", "boxen": "^7.0.0", "inquirer": "^9.0.0" },
  "devDependencies": { "tsup": "^8.0.0", "tsx": "^4.0.0", "typescript": "^5.3.0", "vitest": "^1.0.0" }
}
```

---

## CI/CD (.github/workflows/)

### ci.yml
- Trigger: push to main, all PRs
- Matrix: Node 18, 20, 22
- Steps: pnpm install → lint → typecheck → test → build
- Python job: install → ruff check → pytest

### publish-npm.yml
- Trigger: git tag `v*`
- Publish @goalos/core, @goalos/mcp-server, goalos (CLI) to npm
- Requires NPM_TOKEN secret

### publish-pypi.yml
- Trigger: git tag `v*`
- Build and publish goalos to PyPI using hatch
- Requires PYPI_TOKEN secret

---

## TESTING REQUIREMENTS

- Unit tests for every public method in every package
- Integration tests for full workflows: create graph → add goals → add dependencies → query → serialize → deserialize → validate
- Edge cases: empty graphs, circular dependencies, invalid schemas, permission denied, merge conflicts, goals with all optional fields empty, goals with all optional fields populated
- Fixture-based tests using JSON files in tests/fixtures/
- Minimum 80% code coverage per package

---

## MANIFESTO BLOG POST (website/blog/manifesto.md)

Write 2500-3000 words. Title: **"Your AI Tools Are Powerful. They Just Don't Know What You Want."**

1. **The Problem** (500w) — You use 5+ AI tools daily. Each optimizes locally with zero awareness of your bigger picture.
2. **Why Memory Isn't Enough** (400w) — Mem0/Plurality store FACTS. Facts != intentions.
3. **Introducing Intent Graphs** (500w) — Structured, machine-readable representation of what you want.
4. **How It Works** (500w) — Code examples.
5. **The Network Effect** (300w) — Every connected tool makes every other tool more useful.
6. **What We're Building** (300w) — Open spec, open source, MCP server.
7. **Call to Action** (200w) — Star repo, try CLI, connect first tool.

Tone: Stripe engineering blog meets HashiCorp product announcement.

---

## IMPLEMENTATION ORDER

1. `spec/schema/` — JSON Schemas first
2. `spec/examples/` — Example intent graphs
3. `packages/goalos-core/src/types.ts` → `goal.ts` → `intent-graph.ts` → remaining modules
4. Tests for goalos-core
5. `packages/goalos-cli/` — CLI using goalos-core
6. `packages/goalos-mcp/` — MCP server using goalos-core
7. `packages/goalos-py/` — Python SDK
8. `examples/` — Integration examples
9. `website/` — Landing page + manifesto blog post
10. `.github/workflows/` — CI/CD
11. Root README, CONTRIBUTING, CHANGELOG
