# @goalos/mcp-server

Model Context Protocol server for GoalOS - expose intent graphs to AI agents.

## What is @goalos/mcp-server?

An MCP (Model Context Protocol) server that connects AI agents like Claude to your GoalOS intent graph. Agents can read your goals, get priorities, add new goals, update progress, and manage dependencies.

## Installation

npm install -g @goalos/mcp-server

Or develop:

npm install @goalos/mcp-server

## Quick Start

Start the server:

goalos-mcp

By default it stores data in ~/.goalos/graph.json.

To change runtime settings, set environment variables before launching:

export GOALOS_STORAGE_DIR=~/.goalos
export GOALOS_STORAGE=file
export GOALOS_OWNER=default-owner
export GOALOS_LOG_LEVEL=info
goalos-mcp

## Integration with Claude Desktop

Add to your Claude Desktop config (~/.claude/claude_desktop_config.json):

{
  "mcpServers": {
    "goalos": {
      "command": "goalos-mcp",
      "args": []
    }
  }
}

Restart Claude Desktop. Claude now has access to 9 GoalOS tools.

## Tools

goalos_get_context
- No parameters
- Returns current priorities, active goals, deadlines, blockers
- Call this FIRST each session to get your current state

goalos_list_goals
- Params: status, priority, domain, include_completed
- Lists all goals, filtered and hierarchical
- Returns tree structure

goalos_get_priorities
- Params: count (default 5), time_horizon
- Returns top N priority goals for a time horizon
- Sorted by priority level and score

goalos_get_goal
- Params: goal_id (required)
- Returns full goal with sub-goals and dependencies
- Includes all metadata and relations

goalos_add_goal
- Params: title (required), description, parent_id, priority, domain, deadline, time_horizon, success_criteria, motivation, tags
- Creates new goal
- Returns created goal with ID

goalos_update_goal
- Params: goal_id (required), plus any updatable fields
- Updates goal attributes
- Validates and returns updated goal

goalos_complete_goal
- Params: goal_id (required), notes
- Marks goal as completed
- Auto-updates parent progress and unblocks dependents
- Returns updated goal

goalos_add_dependency
- Params: goal_id (required), depends_on (required), type
- Links two goals with dependency
- Types: requires, blocks, enables, related

goalos_search
- Params: query (required), status, domain
- Full-text search across titles, descriptions, tags
- Returns matching goals

## Configuration

Environment variables:

GOALOS_STORAGE_DIR - Directory for graph.json and goalos.db (default: ~/.goalos)
GOALOS_STORAGE - Storage backend (file|sqlite, default: file)
GOALOS_OWNER - Owner id used for new graphs (default: default-owner)
GOALOS_LOG_LEVEL - Log level (debug|info|warn|error, default: info)

## Examples

Start with file storage:

GOALOS_STORAGE=file goalos-mcp

Start with SQLite:

GOALOS_STORAGE=sqlite goalos-mcp

## Claude Integration Examples

With the MCP server running, Claude can:

Ask: "What are my top 5 priorities?"
Tool: goalos_get_priorities with count=5

Ask: "Add a goal to build a landing page"
Tool: goalos_add_goal with title="Build landing page"

Ask: "Show me all my work goals"
Tool: goalos_list_goals with domain="work"

Ask: "What's blocking my business launch?"
Tool: goalos_get_context (returns blockers)

Ask: "Mark the landing page as done"
Tool: goalos_complete_goal with goal_id=<id>

## Storage

File Storage (default):

- Reads/writes JSON file
- Suitable for personal use
- No additional dependencies

SQLite Storage:

- More efficient for large graphs
- Supports concurrent access
- Install: npm install better-sqlite3

## Error Handling

Tools return proper error responses:

- Tool not found
- Goal not found
- Invalid parameters
- Permission denied
- Storage errors

Errors include descriptive messages for debugging.

## Performance

- Response time: <100ms for typical operations
- No external API calls
- Memory efficient
- Suitable for large graphs (10k+ goals)

## Testing

npm test

Includes:
- Tool execution tests
- Storage tests
- Integration tests with Claude

## Development

npm run dev - Run in watch mode
npm run build - Build for distribution
npm run start - Start server
npm test - Run tests
npm run lint - Lint code

## Documentation

- Main README: ../../README.md
- Full Reference: ../../spec/goalos-mcp-integration.md
- Quickstart: ../../spec/goalos-quickstart.md
- Core API: ../goalos-core/README.md

## License

MIT - See LICENSE
