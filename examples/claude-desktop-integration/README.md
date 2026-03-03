# Claude Desktop + GoalOS Integration

Connect your GoalOS intent graph to Claude Desktop via the Model Context Protocol (MCP). This enables Claude to read your goals, priorities, and dependencies directly from your local intent graph.

## What This Does

- Claude can query your current goals and priorities
- Claude understands your goal hierarchy and dependencies
- Claude can help you plan, prioritize, and break down goals
- All data stays on your machine (sovereign)

## Prerequisites

- Claude Desktop app installed
- Node.js 18+
- GoalOS MCP server built (`@goalos/mcp-server` package)
- A GoalOS intent graph file (see `goalos init` to create one)

## Setup

### 1. Install GoalOS MCP Server

```bash
# From the GoalOS monorepo root
pnpm install
pnpm build

# Or install from npm (when published)
npm install -g @goalos/mcp-server
```

### 2. Get Your GoalOS Graph Path

By default, GoalOS stores your intent graph at:
- **macOS/Linux**: `~/.goalos/graph.json`
- **Windows**: `%APPDATA%\.goalos\graph.json`

Or create one:
```bash
goalos init
goalos add "My first goal"
```

### 3. Configure Claude Desktop

Edit your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

Use the included `claude_desktop_config.json` as a template. Add the GoalOS server:

```json
{
  "mcpServers": {
    "goalos": {
      "command": "goalos-mcp",
      "args": ["--storage", "file"],
      "env": {
        "GOALOS_GRAPH_PATH": "~/.goalos/graph.json"
      }
    }
  }
}
```

### 4. Restart Claude Desktop

Close and reopen Claude Desktop. You should see a hammer icon in the message input area indicating MCP tools are available.

## Usage

In Claude, you can now ask:

```
What are my top 3 priorities this week?
Show me all goals blocking "Launch product"
Which of my goals have a deadline coming up?
What's the breakdown of my "Health" domain goals?
Help me prioritize my engineering goals
```

Claude will use the GoalOS tools to answer these questions by querying your intent graph.

## Available MCP Tools

Through Claude Desktop, Claude has access to:

| Tool | Purpose |
|------|---------|
| `goalos_get_context` | Get your current priorities, active goals, and deadlines |
| `goalos_list_goals` | List all goals filtered by status/priority/domain |
| `goalos_get_goal` | Get full details of a specific goal |
| `goalos_add_goal` | Add a new goal to your intent graph |
| `goalos_update_goal` | Update a goal's details, status, or priority |
| `goalos_complete_goal` | Mark a goal as complete |
| `goalos_add_dependency` | Add a dependency between goals |
| `goalos_search` | Full-text search across your goals |

## Example Conversation

**You**: "What are my top priorities for this quarter?"

**Claude**: I'll check your intent graph...
- Goal: "Launch alpha version" (critical, deadline: Mar 31)
- Goal: "Complete funding round" (high, deadline: Mar 15)
- Goal: "Hire engineer" (high, deadline: Apr 30)

**You**: "What's blocking the launch?"

**Claude**: These goals are blocking "Launch alpha version":
- "Finish payment integration" (blocked by "Security audit")
- "QA testing complete" (waiting on "bug fixes")

**You**: "Help me create a breakdown for the payment integration"

**Claude**: I'll add these sub-goals to "Finish payment integration":
- Implement Stripe webhook handling
- Test edge cases
- Document API for integration

## Configuration Options

### Environment Variables

```bash
# Path to intent graph (default: ~/.goalos/graph.json)
GOALOS_GRAPH_PATH=/custom/path/to/graph.json

# Storage backend: 'file' or 'sqlite' (default: file)
GOALOS_STORAGE=file

# SQLite database path (if using SQLite)
GOALOS_DB_PATH=~/.goalos/goals.db

# Log level: debug, info, warn, error (default: info)
GOALOS_LOG_LEVEL=info
```

### Custom Config File

Instead of environment variables, you can use a config file:

```json
{
  "mcpServers": {
    "goalos": {
      "command": "goalos-mcp",
      "args": [
        "--storage", "file",
        "--graph-path", "/Users/you/.goalos/graph.json"
      ]
    }
  }
}
```

## Troubleshooting

### Claude doesn't see the GoalOS tools

1. Check that Claude Desktop is configured correctly in your config file
2. Ensure the file path is correct
3. Restart Claude Desktop completely
4. Check Claude's error logs: `~/Library/Logs/Claude/` (macOS)

### "Graph file not found" error

Ensure your GoalOS graph exists:
```bash
ls ~/.goalos/graph.json
```

Create one if needed:
```bash
goalos init
```

### MCP server won't start

Check that `goalos-mcp` is installed:
```bash
which goalos-mcp
goalos-mcp --help
```

If not found, reinstall:
```bash
npm install -g @goalos/mcp-server
```

## Security & Privacy

- Your intent graph stays on your machine
- Claude Desktop runs the MCP server locally (no data sent to Anthropic)
- When you share conversations with Anthropic, goal details are included in the chat context
- You can exclude sensitive goals by marking them as private (future feature)

## Next Steps

- Use `goalos prioritize` to interactively set priorities
- Export your graph: `goalos export goals.json`
- Share your spec (not your data) with your team: `goalos export --spec-only`
- Integrate GoalOS with other AI tools via LangChain or CrewAI (see other examples)

## Support

For issues or questions:
- GitHub Issues: https://github.com/Aimaghsoodi/GoalOS/issues
- Discussions: https://github.com/Aimaghsoodi/GoalOS/discussions
