# GoalOS Quickstart

Get up and running with GoalOS in under 2 minutes.

## Installation

```bash
npm install @goalos/core
# or
yarn add @goalos/core
# or
pnpm add @goalos/core
```

## Your First Intent Graph

```typescript
import { IntentGraph } from '@goalos/core';

// Create a new intent graph
const graph = IntentGraph.create('you@example.com', 'My 2024 Goals');

// Add a root goal
const launchProduct = graph.addGoal({
  title: 'Launch AI product',
  description: 'Get our new AI product to market',
  priority: { level: 'critical' },
  deadline: '2024-03-15',
  successCriteria: [
    'Live on Product Hunt',
    '100+ signups on day one',
    'Positive community feedback'
  ],
  domain: 'work',
  tags: ['startup', 'product']
});

// Add sub-goals
const buildLanding = graph.addGoal({
  title: 'Build landing page',
  parentId: launchProduct.id,
  priority: { level: 'high' },
  deadline: '2024-03-10'
});

const conductInterviews = graph.addGoal({
  title: 'Customer interviews',
  parentId: launchProduct.id,
  priority: { level: 'high' }
});

// Add dependency: interviews require landing page feedback
graph.addDependency(conductInterviews.id, {
  type: 'requires',
  targetGoalId: buildLanding.id,
  description: 'Need landing page for gathering customer feedback'
});

// Get your top 5 priorities
const topPriorities = graph.getTopPriorities(5);
console.log('Top priorities:', topPriorities);

// Get all goals by status
const activeGoals = graph.getByStatus('active');
console.log('Active goals:', activeGoals.length);

// Save to file
await graph.toFile('~/.goalos/my-goals.json');

// Or export as JSON-LD
const jsonld = graph.toJSONLD();
console.log(JSON.stringify(jsonld, null, 2));
```

## Using the CLI

```bash
# Create a new intent graph in current directory
goalos init

# Add a goal
goalos add "Learn machine learning"
goalos add "Complete ML course" --parent goal_abc123

# List all goals
goalos list

# View status dashboard
goalos status

# Mark a goal as complete
goalos complete goal_xyz789

# Start the MCP server
goalos serve

# Export to JSON
goalos export my-goals.json

# Validate your intent graph
goalos validate
```

## Connecting to AI Tools

Once you have an intent graph, connect it to AI tools via MCP:

```bash
# Start the GoalOS MCP server
goalos serve

# In Claude Desktop (on macOS): ~/.claude/config.json
{
  "mcpServers": {
    "goalos": {
      "command": "goalos",
      "args": ["serve"]
    }
  }
}
```

Now Claude and other MCP-compatible tools can read your goals and priorities automatically.

## Python

```python
from goalos import IntentGraph

# Create a graph
graph = IntentGraph.create('you@example.com', 'My Goals')

# Add a goal
goal = graph.add_goal(
    title='Launch product',
    priority={'level': 'critical'},
    deadline='2024-03-15'
)

# Get top priorities
top5 = graph.get_top_priorities(5)

# Save to file
graph.to_file('~/.goalos/goals.json')
```

## Next Steps

- Read the [Full Specification](goalos-spec-v0.1.md)
- Explore [MCP Integration](goalos-mcp-integration.md)
- Check [CLI Reference](goalos-cli-reference.md)
- Learn [Priority Calculation](goalos-priority-engine.md)
- Review [Permission Model](goalos-permissions.md)
