# GoalOS MCP Integration

Connect any AI tool to your GoalOS intent graph via the Model Context Protocol.

## Overview

GoalOS provides an MCP server that exposes your intent graph to any MCP-compatible AI tool. This allows Claude, LangChain, CrewAI, and other agents to understand your goals, priorities, and constraints.

## Starting the Server

```bash
# Start with default file storage
goalos serve

# Start with SQLite backend
goalos serve --storage sqlite --db ~/.goalos/goals.db

# Start on custom port
goalos serve --port 3000
```

## Available Tools

The GoalOS MCP server exposes 9 tools:

### 1. `goalos_get_context`
Get a summary of your current priorities, active goals, and deadlines.

**Best for:** Agents starting a new task. Call this first in each session.

```json
{
  "response": {
    "activeGoalsCount": 12,
    "topPriorities": [...],
    "urgentDeadlines": [...],
    "blockedItems": [...]
  }
}
```

### 2. `goalos_list_goals`
List all goals with optional filtering.

**Parameters:**
- `status`: "active" | "planned" | "blocked" | "completed"
- `priority`: "critical" | "high" | "medium" | "low" | "someday"
- `domain`: Filter by domain (work, personal, health, etc.)
- `include_completed`: bool (default: false)

```bash
# Get all active work goals
goalos_list_goals(status="active", domain="work")
```

### 3. `goalos_get_priorities`
Get top N priority goals for a time horizon.

**Parameters:**
- `count`: Number of goals (default: 5)
- `time_horizon`: "today" | "this_week" | "this_month" | "this_quarter"

```bash
goalos_get_priorities(count=3, time_horizon="today")
```

### 4. `goalos_get_goal`
Get full details of a single goal with sub-goals and dependencies.

**Parameters:**
- `goal_id`: ID of the goal

```bash
goalos_get_goal(goal_id="goal_abc123")
```

**Response includes:**
- Full goal object
- All sub-goals (children)
- Dependencies (what blocks it, what it blocks)
- Progress percentage
- Success criteria

### 5. `goalos_add_goal`
Add a new goal to the graph.

**Parameters:**
- `title` (required): Goal title
- `description`: Optional description
- `parent_id`: Parent goal ID (for sub-goals)
- `priority`: { level: "critical" | "high" | "medium" | "low" | "someday" }
- `domain`: "work" | "personal" | "health" | "creative"
- `deadline`: ISO 8601 datetime
- `time_horizon`: "today" | "this_week" | "this_month" | "this_quarter" | "this_year"
- `success_criteria`: Array of measurable criteria
- `motivation`: Why this goal matters
- `tags`: Array of tags

```bash
goalos_add_goal(
  title="Complete Q1 roadmap",
  priority={"level": "high"},
  parent_id="goal_product_launch",
  deadline="2024-03-31",
  success_criteria=["All items shipped", "Customer feedback positive"]
)
```

### 6. `goalos_update_goal`
Update a goal's details, status, or priority.

**Parameters:**
- `goal_id` (required)
- Any updatable field (title, priority, status, etc.)

```bash
goalos_update_goal(
  goal_id="goal_abc123",
  status="blocked",
  priority={"level": "medium"}
)
```

### 7. `goalos_complete_goal`
Mark a goal as done.

**Parameters:**
- `goal_id` (required)
- `notes`: Optional completion notes

```bash
goalos_complete_goal(goal_id="goal_abc123", notes="Shipped on schedule")
```

**Side effects:**
- Goal status becomes "completed"
- Parent goal progress updates
- Dependent goals are unblocked
- Completion event is logged

### 8. `goalos_add_dependency`
Add a dependency between goals.

**Parameters:**
- `goal_id` (required): The dependent goal
- `depends_on` (required): The goal it depends on
- `type`: "requires" | "blocks" | "enables" | "related"

```bash
goalos_add_dependency(
  goal_id="goal_customer_research",
  depends_on="goal_landing_page",
  type="requires"
)
```

### 9. `goalos_search`
Full-text search across goals.

**Parameters:**
- `query` (required): Search query
- `status`: Optional status filter
- `limit`: Max results (default: 20)

```bash
goalos_search(query="Q1 planning", status="active")
```

## Claude Desktop Configuration

Configure GoalOS for Claude Desktop:

**macOS:** `~/.claude/config.json`

```json
{
  "mcpServers": {
    "goalos": {
      "command": "goalos",
      "args": ["serve"]
    }
  }
}
```

**Windows:** `%APPDATA%\Claude\config.json`

```json
{
  "mcpServers": {
    "goalos": {
      "command": "goalos.exe",
      "args": ["serve"]
    }
  }
}
```

## Usage Examples

### Example 1: Agent Starts Session

```
User: "What should I focus on today?"

Claude calls: goalos_get_context()
  → Returns top 3 priorities for today
  → Reviews 2 urgent deadlines

Response: "Based on your goals, you should focus on:
  1. Finish Q1 roadmap (due today)
  2. Customer interview prep (due tomorrow)
  3. Marketing deck review (high priority)"
```

### Example 2: Agent Helps with Task Planning

```
User: "Help me plan the product launch"

Claude calls: goalos_get_goal(goal_id="goal_launch")
  → Gets main goal + all sub-goals
  → Reviews dependencies
  → Sees that landing page blocks interviews

Response: "I see you have 7 sub-tasks for launch. 
  The critical path is:
  1. Landing page (due Mar 10)
  2. Customer interviews (depends on landing)
  3. Marketing prep (can start now)
  4. Launch day prep (due Mar 15)
  
  You're on track if landing finishes by Mar 10."
```

### Example 3: Agent Updates Progress

```
User: "We just shipped the landing page"

Claude calls: goalos_complete_goal(goal_id="goal_landing_page")
  → Marks landing page complete
  → Automatically unblocks interviews
  → Updates parent launch goal progress

Claude calls: goalos_get_priorities(count=3, time_horizon="this_week")
  → Gets updated top priorities now that landing is done

Response: "Great! Landing page complete. This unblocks
  your customer interviews. New top priority for the week:
  1. Customer interviews (now unblocked)
  2. Marketing deck
  3. Investor pitch prep"
```

## Best Practices

1. **Always start with `goalos_get_context()`** — Agents need to understand the current state before making decisions
2. **Check dependencies before planning** — Use `goalos_get_goal()` to see what blocks what
3. **Verify permissions** — The server respects your permission model
4. **Log all changes** — Every `_update_goal()` or `_complete_goal()` creates an event for audit trails
5. **Use time horizons** — Filter by time horizon to focus on what matters now

## Storage Backends

### File-Based (Default)

```bash
goalos serve --storage file --path ~/.goalos/graph.json
```

- Simple, human-readable
- No server needed
- Good for single-user setups
- File size limits for very large graphs

### SQLite

```bash
goalos serve --storage sqlite --db ~/.goalos/goals.db
```

- Better for large graphs
- Indexed queries
- Transaction support
- Better for team setups

### Future: Cloud

```bash
goalos serve --storage cloud --token <API_TOKEN>
```

Planned for 1.0 release.

## Security & Permissions

GoalOS supports fine-grained permissions:

```typescript
// Grant Claude read + complete permissions
graph.grantPermission('claude-desktop', {
  agentId: 'claude-desktop',
  capabilities: ['read', 'complete'],
  scope: {
    domains: ['work'],
    maxDepth: 3 // Can only see 3 levels deep
  }
});
```

See [Permissions Model](goalos-permissions.md) for details.

## Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :3000

# Try different port
goalos serve --port 3001
```

### Tool calls fail
```bash
# Validate your intent graph
goalos validate

# Check server logs
goalos serve --verbose
```

### Performance issues with large graphs
```bash
# Use SQLite backend instead of file
goalos serve --storage sqlite --db goals.db
```
