# goalos (CLI)

Command-line tool for managing GoalOS intent graphs.

## What is the goalos CLI?

A terminal-based tool to create, view, update, and manage your personal intent graphs. Use it standalone or as part of your development workflow.

## Installation

npm install -g goalos

Or with pnpm:

pnpm add -g goalos

## Quick Start

Initialize a new intent graph:

goalos init

Add a goal:

goalos add "Launch AI consulting business"

View your goals:

goalos list

See priorities and progress:

goalos status

Mark a goal as done:

goalos complete goal_abc123

## Commands

goalos init - Create new intent graph in current directory

goalos add <title> - Add a new goal

goalos list - Show all goals as a tree with priorities

goalos status - Dashboard showing top priorities, deadlines, blockers, progress

goalos update <id> - Update a goal (interactive prompts)

goalos complete <id> - Mark a goal as done

goalos block <id> --by <id> - Mark goal as blocked by another goal

goalos unblock <id> - Unblock a goal

goalos prioritize - Interactive priority setting with prompts

goalos tree - Show full goal tree with dependencies

goalos export [file] - Export intent graph to JSON

goalos import <file> - Import intent graph from JSON

goalos serve - Start GoalOS MCP server over stdio for Claude Desktop
goalos serve --storage <file|sqlite> - Choose the MCP storage backend

goalos validate - Validate the intent graph schema

## Options

--format <json|tree|table> - Output format (default: tree)
--domain <domain> - Filter by domain (work, personal, health, etc.)
--status <status> - Filter by status (active, planned, blocked, completed)
--priority <level> - Filter by priority (critical, high, medium, low, someday)
--config <path> - Config file path (default: ~/.goalos/config.json)
--file <path> - Intent graph file (default: ~/.goalos/graph.json)

## Examples

Add multiple goals:

goalos add "Build landing page"
goalos add "Do customer research" --priority high --domain work

List work goals only:

goalos list --domain work

Export and backup:

goalos export backup.json

View only active high-priority goals:

goalos list --status active --priority high

Interactive prioritization:

goalos prioritize

## Configuration

Config file at ~/.goalos/config.json:

{
  "graphPath": "~/.goalos/graph.json",
  "defaultFormat": "tree",
  "defaultDomain": "work",
  "autoBrowser": false,
  "colorOutput": true,
  "defaultTimeHorizon": "this_quarter"
}

## Global Graph Storage

By default, goalos stores your intent graph at:

~/.goalos/graph.json

Or specify a different path with --file:

goalos list --file /path/to/goals.json

## MCP Server Integration

The goalos serve command starts the MCP server for integration with Claude Desktop:

goalos serve

Configure Claude Desktop:

{
  "mcpServers": {
    "goalos": {
      "command": "goalos",
      "args": ["serve"]
    }
  }
}

Claude then has 9 tools to read and update your goals.

## Development

npm run dev - Run in development mode

npm test - Run tests

npm run lint - Lint code

npm run build - Build for distribution

## Documentation

- Main README: ../../README.md
- Full Reference: ../../spec/goalos-cli-reference.md
- Quickstart Guide: ../../spec/goalos-quickstart.md
- MCP Integration: ../../spec/goalos-mcp-integration.md

## License

MIT - See LICENSE
