# GoalOS Specification v0.1.0

**Date:** February 2026
**Status:** Initial Release
**Version:** 0.1.0

## Executive Summary

GoalOS defines a specification for structured **intent graphs** — machine-readable representations of human goals, priorities, and intentions. Intent graphs enable AI agents and tools to understand the larger context of human ambitions, coordinate their actions, and make decisions that advance stated objectives rather than optimize locally without awareness of the bigger picture.

This specification includes:
- Complete data model for goals, dependencies, and permissions
- JSON Schema definitions for validation
- Protocol for agent interaction via Model Context Protocol (MCP)
- Real-world examples demonstrating usage patterns
- Design principles for extensibility and long-term compatibility

## 1. Problem Statement

### The AI Tools Problem

Today, humans use 5+ AI tools daily: Claude, ChatGPT, Copilot, specialized agents, etc. Each tool:
- Optimizes **locally** without awareness of other goals
- Lacks context about what matters most
- Cannot coordinate with other tools
- May suggest actions that undermine other objectives

**Example:** You tell Claude about a fitness goal. Claude suggests eating less and exercising more. You tell a content creation tool you're building a personal brand. It suggests focusing full-time on content. You tell a career advisor you're planning a transition. It suggests you save aggressively. All locally optimal, all contradictory.

### Why Memory Isn't Enough

Existing "memory" solutions (Mem0, Plurality, etc.) store **facts about users**:
- "I'm a data scientist"
- "I live in San Francisco"
- "I like coffee"

These are useful for personalization but miss the **intent layer** — the machine-readable representation of what someone is *trying to achieve*:
- "Transition from data science to AI entrepreneurship over 18 months"
- "Launch a business generating $50K/month by December"
- "Build network with 5+ founder mentors"

Facts don't tell AI agents how to help; intentions do.

### The Need for Coordination

Multiple AI tools are more powerful than single tools **only if they coordinate**. Coordination requires:
1. A shared vocabulary for goals and priorities
2. Machine-readable success criteria
3. Visibility into dependencies between objectives
4. Permission and scoping rules so tools don't overstep
5. Audit trail of how goals evolve

GoalOS provides the layer that makes coordination possible.

## 2. Data Model

### 2.1 Goal

A **goal** is the fundamental unit in an intent graph. It represents a specific objective with rich metadata.

```typescript
interface Goal {
  // Identity
  id: string;                          // Unique identifier (nanoid, e.g., "goal_V1StGXR8")

  // Core definition
  title: string;                       // Short, descriptive title
  description?: string;                // Longer explanation

  // Hierarchy
  parentId?: string;                   // Parent goal ID for sub-goals

  // Status and progress
  status: GoalStatus;                  // active | planned | blocked | paused | completed | abandoned
  priority: Priority;                  // Priority level and score

  // Success criteria
  successCriteria?: string[];          // Measurable criteria for "done"

  // Timeline
  deadline?: string;                   // ISO 8601 deadline
  timeHorizon?: TimeHorizon;           // Relative timeframe (e.g., "this_quarter")
  estimatedEffort?: Duration;          // Expected effort to complete

  // Context
  motivation?: string;                 // Why this goal matters
  tags?: string[];                     // Categories and labels
  domain?: string;                     // Domain (work, personal, health, etc.)

  // Relationships
  dependencies?: Dependency[];         // Other goals this depends on
  permissions?: Permission[];          // Agent access control for this goal

  // Metadata
  createdAt: string;                   // ISO 8601 timestamp
  updatedAt: string;                   // ISO 8601 timestamp
  completedAt?: string;                // When completed
  createdBy?: string;                  // Creating agent or user
  version: number;                     // Optimistic locking version
  metadata?: Record<string, unknown>;  // Custom extensible metadata
}

type GoalStatus =
  | 'active'                           // Currently being worked on
  | 'planned'                          // Scheduled but not started
  | 'blocked'                          // Paused due to dependency or blocker
  | 'paused'                           // Intentionally paused
  | 'completed'                        // Successfully finished
  | 'abandoned'                        // Cancelled or deprioritized

interface Priority {
  level: PriorityLevel;                // Categorical priority
  score?: number;                      // Numeric score 0-100 for sorting
  reason?: string;                     // Justification for priority
}

type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'someday'

type TimeHorizon =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'this_quarter'
  | 'this_year'
  | 'long_term'

interface Duration {
  value: number;                       // Numeric value
  unit: 'minutes' | 'hours' | 'days' | 'weeks'
}
```

### 2.2 Goal Hierarchy

Goals form a tree structure through the `parentId` field:

```
┌─ Launch Product (critical)
│  ├─ Build MVP (critical)
│  │  ├─ Database Schema (high)
│  │  ├─ API Layer (high)
│  │  └─ Frontend UI (high)
│  ├─ Get First Users (high)
│  │  ├─ Marketing Page (high)
│  │  └─ Cold Outreach (medium)
│  └─ Secure Funding (high)
│     └─ Create Pitch Deck (high)
└─ Grow Team (medium)
   ├─ Hire CTO (medium)
   └─ Build Recruiting Process (low)
```

This structure enables:
- **Context** — Sub-goals inherit parent context and priorities
- **Progress tracking** — Parent goal progress = average of child progress
- **Blocking** — Child goal completion can unblock parent dependencies
- **Scoping** — Agent permissions can be scoped to sub-trees

### 2.3 Dependencies

Goals can express relationships to other goals:

```typescript
interface Dependency {
  type: DependencyType;                // Relationship type
  targetGoalId: string;                // Which goal this refers to
  description?: string;                // Human explanation
}

type DependencyType =
  | 'blocks'                           // This goal blocks target (B can't start until A done)
  | 'requires'                         // This goal requires target (must do target first)
  | 'enables'                          // This goal enables target (unblocks it)
  | 'related'                          // Related but no blocking relationship
```

**Semantics:**

- `A blocks B` — Goal A prevents Goal B from completing (e.g., "Write marketing copy blocks publishing")
- `A requires B` — Goal A cannot start without Goal B complete (e.g., "Launch product requires API implementation")
- `A enables B` — Goal A removes a blocker on Goal B (e.g., "Hire designer enables UI design work")
- `A related B` — Goals are semantically connected but no ordering constraint

**Properties:**

- Dependencies must reference existing goals (referential integrity)
- Circular dependencies should be detected and reported
- Dependency chains inform priority and ordering recommendations
- Goals with all dependencies met are "unblocked" and ready to work on

### 2.4 Priority

Priority combines categorical and numeric dimensions:

**Categorical:**
- **critical** — Time-sensitive or foundational; blocks other work
- **high** — Important; should be addressed this period
- **medium** — Standard priority; non-blocking
- **low** — Nice-to-have; defer unless time permits
- **someday** — Interesting but unscheduled; no deadline

**Numeric:**
- Score 0-100 for deterministic sorting
- Calculated from: category (weight), deadline proximity, dependency count, effort
- Enables prioritization algorithms that respect both explicit and implicit priority

### 2.5 Permissions

Fine-grained access control allows agents to access only what they need:

```typescript
interface Permission {
  agentId: string;                     // Name of agent (e.g., "claude-desktop")
  capabilities: PermissionCapability[]; // What the agent can do
  scope?: PermissionScope;             // Constraints on the permission
}

type PermissionCapability =
  | 'read'                             // Read goal data
  | 'write'                            // Update goal metadata
  | 'complete'                         // Mark goal complete
  | 'create_sub_goals'                 // Add sub-goals
  | 'reprioritize'                     // Change priority

interface PermissionScope {
  goalIds?: string[];                  // Specific goals (null = all)
  domains?: string[];                  // Specific domains (null = all)
  maxDepth?: number;                   // Maximum nesting depth (null = unlimited)
}
```

**Example:**

```json
{
  "agentId": "content-scheduler",
  "capabilities": ["read", "write", "complete"],
  "scope": {
    "domains": ["marketing", "content"]
  }
}
```

This agent can read, modify, and complete goals in marketing and content domains, but no other domains.

### 2.6 IntentGraph

The complete graph containing all goals and metadata:

```typescript
interface IntentGraph {
  id: string;                          // Unique graph identifier
  version: string;                     // Spec version (e.g., "0.1.0")
  owner: string;                       // User ID or email

  name?: string;                       // Human-readable name
  description?: string;                // Description of intent

  goals: Goal[];                       // All goals in the graph
  defaultPermissions?: Permission[];   // Permissions for all agents by default

  createdAt: string;                   // ISO 8601 creation timestamp
  updatedAt: string;                   // ISO 8601 last update timestamp

  metadata?: Record<string, unknown>;  // Extensible metadata
}
```

**Invariants:**

- Every goal's `parentId` must reference an existing goal or be null
- Every dependency's `targetGoalId` must reference an existing goal
- Graph IDs follow pattern: `graph_[a-zA-Z0-9_-]+`
- Goal IDs follow pattern: `goal_[a-zA-Z0-9_-]+`
- All timestamps are ISO 8601 UTC

### 2.7 Events

Goals change over time. Events capture these changes:

```typescript
interface GoalEvent {
  id: string;                          // Unique event ID
  type: GoalEventType;                 // What happened
  goalId: string;                      // Which goal
  timestamp: string;                   // ISO 8601 when
  agentId?: string;                    // Who triggered it
  data?: Record<string, unknown>;      // Event-specific data
  previousState?: Partial<Goal>;       // State before change
}

type GoalEventType =
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
  | 'goal.permission_revoked'
```

Events enable:
- Audit logging of goal changes
- Notification of interested parties
- Replay and historical analysis
- Conflict detection in collaborative scenarios

## 3. Operations

### 3.1 Basic CRUD

**Create Goal:**
```json
POST /api/v1/goals
{
  "title": "Build landing page",
  "status": "planned",
  "priority": {"level": "high"},
  "deadline": "2026-03-31T23:59:59Z",
  "domain": "marketing"
}
```

**Read Goal:**
```json
GET /api/v1/goals/{goalId}
```

**Update Goal:**
```json
PATCH /api/v1/goals/{goalId}
{
  "status": "active",
  "priority": {"level": "critical", "score": 95}
}
```

**Delete Goal:**
```json
DELETE /api/v1/goals/{goalId}
```

### 3.2 Status Transitions

Legal state transitions:

```
        ┌─ abandoned
        │
planned ─┤─ active ─┬─ blocked ─┬─ paused
        │         │           └─ active
        └─────────┴─ completed
```

**Rules:**
- Cannot complete blocked goal
- Completing parent must auto-complete matching children
- Completing a goal unblocks dependents
- Only abandoned goals can be reactivated (via update)

### 3.3 Queries

**By Status:**
```
graph.getByStatus('active')        // All active goals
graph.getByStatus(['active', 'planned'])  // Multiple statuses
```

**By Priority:**
```
graph.getTopPriorities(5)          // Top 5 by priority
graph.getByPriority('critical')    // All critical
```

**By Domain:**
```
graph.getByDomain('marketing')     // All marketing domain
```

**By Tags:**
```
graph.getByTag('urgent')           // All tagged urgent
```

**Hierarchical:**
```
graph.getChildren(parentId)        // Direct children
graph.getDescendants(parentId)     // All descendants
graph.getRootGoals()               // Top-level goals
```

**Complex Filters:**
```
graph.query({
  status: ['active', 'planned'],
  priority: ['critical', 'high'],
  domain: 'work',
  hasDeadline: true,
  deadlineBefore: '2026-03-31',
  tags: ['urgent'],
  search: 'launch'
})
```

### 3.4 Dependency Operations

**Add Dependency:**
```
graph.addDependency(goalId, {
  type: 'requires',
  targetGoalId: 'goal_xyz',
  description: 'Need API before frontend'
})
```

**Remove Dependency:**
```
graph.removeDependency(goalId, targetGoalId)
```

**Check Blocking:**
```
blockers = graph.getBlockers(goalId)  // Goals blocking this one
unblocked = graph.getUnblockedGoals() // Goals ready to work on
```

**Cycle Detection:**
```
cycles = graph.detectCycles()     // Returns null if no cycles, or list of cycle IDs
```

## 4. Integration Points

### 4.1 Model Context Protocol (MCP)

GoalOS exposes intent graphs via MCP, enabling Claude and other tools to:
- Read current goals and priorities
- Add new goals as they arise
- Update status as work progresses
- Query for context-relevant goals

**MCP Tools:**

| Tool | Description |
|------|-------------|
| `goalos_get_context` | Summary of priorities, active goals, deadlines, blockers |
| `goalos_list_goals` | All goals with optional filtering |
| `goalos_get_priorities` | Top N priority goals |
| `goalos_add_goal` | Create new goal |
| `goalos_update_goal` | Update goal details |
| `goalos_complete_goal` | Mark goal done |
| `goalos_add_dependency` | Add dependency between goals |
| `goalos_search` | Full-text search across goals |

### 4.2 Storage

**File-based (default):**
- Goals stored in `~/.goalos/graph.json`
- Single user, local ownership
- Simple JSON file, version-controlled

**Database:**
- Optional SQLite or PostgreSQL backend
- Multi-user, team scenarios
- Supports history and audit logging

**Cloud (future):**
- GoalOS Cloud API for sync across devices
- Optional team collaboration features
- Encryption at rest

### 4.3 CLI

```bash
goalos init                    # Create new intent graph
goalos add "Title"             # Add goal (interactive)
goalos list                    # Show all goals as tree
goalos status                  # Dashboard of priorities
goalos update <id>             # Modify goal
goalos complete <id>           # Mark done
goalos prioritize              # Interactive re-prioritization
goalos export [file]           # Export as JSON
goalos import <file>           # Import from JSON
goalos serve                   # Start MCP server for Claude Desktop
```

## 5. Serialization

### 5.1 JSON Format

Standard JSON serialization for storage and transport:

```json
{
  "id": "graph_q1_2026",
  "version": "0.1.0",
  "owner": "user@example.com",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-02-28T12:00:00Z",
  "goals": [
    {
      "id": "goal_root_123",
      "title": "Launch Product",
      "status": "active",
      "priority": {"level": "critical", "score": 100},
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-02-28T12:00:00Z",
      "version": 1
    }
  ]
}
```

### 5.2 JSON-LD

Linked Data format for semantic web integration:

```json
{
  "@context": "https://goalos.dev/context.jsonld",
  "@type": "IntentGraph",
  "id": "https://user.example.com/goals/q1-2026",
  "name": "Q1 2026 Goals",
  "owner": "https://user.example.com/",
  "goals": [
    {
      "@type": "Goal",
      "id": "https://user.example.com/goals/q1-2026/launch-product",
      "title": "Launch Product",
      "status": "active",
      "priority": "critical"
    }
  ]
}
```

## 6. Validation

### 6.1 Schema Validation

All intent graphs must validate against JSON Schema:

```bash
# Command-line validation
ajv validate -s spec/schema/intent-graph.schema.json -d goals.json

# Programmatic validation
const Ajv = require('ajv');
const schema = require('./goal.schema.json');
const ajv = new Ajv();
const valid = ajv.validate(schema, goalData);
```

### 6.2 Semantic Validation

Beyond schema:
- All referenced goal IDs must exist
- No circular dependencies
- Parent goal must exist if parentId is specified
- Timestamps must be valid ISO 8601
- Version numbers must be positive integers

### 6.3 Business Logic Validation

- Completed goals cannot have active child goals
- Blocked goals cannot transition to completed without unblocking
- Success criteria must be objective and measurable

## 7. Use Cases

### 7.1 Personal Goal Management

Alice uses GoalOS with Claude Desktop:
1. Creates intent graph with yearly goals, quarterly focus, weekly actions
2. Claude reads graph context every session
3. When Claude makes suggestions, they align with Alice's stated priorities
4. Alice updates progress as goals complete; Claude automatically celebrates wins and suggests next steps

### 7.2 Team Alignment

Engineering team maintains shared intent graph:
1. CEO defines quarterly OKRs
2. Teams inherit OKRs, define their goals
3. Individual engineers map their work to team goals
4. Tools (Jira, code review bot, etc.) read goal context for prioritization
5. Weekly status updates bubble up goal progress

### 7.3 Multi-Agent Coordination

Multiple AI agents read same intent graph:
1. Content scheduler reads marketing goals, schedules content calendar
2. Analytics bot reads goals, flags progress on KPIs
3. Customer service bot reads goals, prioritizes requests that advance them
4. Email agent reads goals, surfaces relevant opportunities

All agents coordinate through shared goal context.

### 7.4 Career Transition Planning

Career counselor helps client transition:
1. Creates intent graph with: current skills, target role, timeline, milestones
2. Breaks into: learning goals, networking goals, project portfolio goals
3. Claude reads graph, suggests courses, networking events, project ideas
4. Career counselor reviews progress monthly, adjusts based on market changes

## 8. Design Principles

### 8.1 Simplicity

- Minimal required fields
- Optional fields for extensibility
- Clear, unambiguous semantics
- Easy to understand without deep study

### 8.2 Sovereignty

- Users own their data
- Local-first by default
- Portable JSON format, no vendor lock-in
- Works offline

### 8.3 Composability

- Works with existing tools via MCP
- Can be used standalone or combined
- Supports exporting/importing intent graphs
- Merging multiple graphs supported

### 8.4 Extensibility

- Custom metadata fields on any object
- Domain-specific extensions possible
- Version-forward compatible

### 8.5 Transparency

- Open specification
- Human-readable JSON
- Audit trail via events
- Clear permission model

## 9. Future Directions

### 9.1 Collaborative Graphs

- Multiple users contributing to shared intent graph
- Merge strategies for conflicting updates
- Comments and discussions on goals
- Read-only sharing for visibility

### 9.2 Rich Goal Content

- Attach files and links to goals
- Embedded videos for goal motivation
- Templates for common goal types
- Integration with other document types

### 9.3 Prediction and Planning

- ML models estimating goal completion likelihood
- Automated deadline suggestions based on effort
- Resource conflict detection across goals
- Capacity planning for teams

### 9.4 Domain-Specific Extensions

- Health: integrate with fitness trackers, health data
- Finance: link to budgets and financial plans
- Career: tie to skill frameworks and growth models
- Product: connect to roadmaps and customer feedback

## 10. Changelog

### 0.1.0 (February 2026)

Initial release featuring:
- Core Goal model with status, priority, hierarchy
- Dependencies with cycle detection
- Permissions and scoping for agents
- JSON Schema validation
- 5 real-world example intent graphs
- MCP integration protocol
- CLI and SDKs (TypeScript, Python)

## 11. References

- **Model Context Protocol:** https://modelcontextprotocol.io
- **JSON Schema Draft 7:** https://json-schema.org/draft/2020-12/
- **ISO 8601 Timestamps:** https://en.wikipedia.org/wiki/ISO_8601
- **nanoid:** https://github.com/ai/nanoid (ID generation)

## 12. License

The GoalOS specification and reference implementations are released under the MIT License.

---

**For questions, feature requests, or issues:** GitHub Issues at github.com/Aimaghsoodi/GoalOS
