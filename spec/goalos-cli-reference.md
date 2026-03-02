# GoalOS CLI Reference

Command-line interface for managing intent graphs.

## Installation

```bash
npm install -g goalos
# or if installed locally
npx goalos <command>
```

## Commands

### init

Initialize a new intent graph in the current directory.

```bash
goalos init

# Options:
goalos init --name "My Goals"
goalos init --owner "you@example.com"
```

Creates `goalos.json` in current directory.

### add

Add a new goal.

```bash
goalos add "Learn Rust"

# With options:
goalos add "Learn Rust" \
  --priority high \
  --deadline 2024-06-30 \
  --domain personal \
  --tag "learning" \
  --tag "programming" \
  --parent goal_xyz

# With success criteria:
goalos add "Launch MVP" \
  --criteria "Live on GitHub" \
  --criteria "3 beta users" \
  --criteria "Basic docs"

# With motivation:
goalos add "Write book" \
  --motivation "Establish authority in AI safety"
```

### list

List all goals as a tree.

```bash
# List all
goalos list

# Filter by status
goalos list --status active
goalos list --status completed

# Filter by priority
goalos list --priority critical
goalos list --priority high

# Filter by domain
goalos list --domain work
goalos list --domain personal

# Change output format
goalos list --format tree        # Default, visual tree
goalos list --format table       # Table view
goalos list --format json        # JSON output
goalos list --format compact     # One-liner per goal

# Show completed goals
goalos list --include-completed

# Search
goalos list --search "Q1"
```

Example output:
```
My Goals
├── Launch AI product (critical) [10/15]
│   ├── Landing page (high) [COMPLETE]
│   ├── Customer interviews (high) [In progress]
│   └── Marketing prep (medium)
├── Learn Rust (high)
│   └── Complete rustlings course (high)
└── Health goals (medium) [2/5]
    ├── Run 3x/week (medium)
    ├── Sleep 8 hours/night (medium)
    └── Morning meditation (low)
```

### status

Show a dashboard of your goals and progress.

```bash
goalos status

# With time horizon
goalos status --horizon today
goalos status --horizon week
goalos status --horizon month
```

Example output:
```
GoalOS Status Dashboard
==================================================

TOP PRIORITIES (Today)
  1. [URGENT] Landing page (due today)
  2. [HIGH] Customer interviews (due tomorrow)

THIS WEEK
  Critical: 1 goal | High: 3 goals | Medium: 5 goals
  Active: 8 | Blocked: 1 | Completed: 2

NEXT WEEK
  Total goals: 12 | Progress: 45%

UPCOMING DEADLINES
  Today:     1 goal
  Tomorrow:  2 goals
  This week: 4 goals

BLOCKERS
  • Customer interviews ← Waiting on landing page

COMPLETION RATE: 35% (7/20 goals)
```

### update

Update a goal.

```bash
goalos update goal_abc123 --title "New title"
goalos update goal_abc123 --priority critical
goalos update goal_abc123 --status blocked
goalos update goal_abc123 --deadline 2024-04-15

# Multiple updates
goalos update goal_abc123 \
  --title "Updated title" \
  --priority high \
  --status active
```

### complete

Mark a goal as done.

```bash
goalos complete goal_abc123

# With completion notes
goalos complete goal_abc123 --notes "Shipped early, great team effort"
```

Effects:
- Goal status becomes `completed`
- Parent goal progress updates
- Dependent goals are unblocked
- Completion timestamp is recorded

### block

Mark a goal as blocked.

```bash
goalos block goal_abc123 --by goal_def456
```

### unblock

Unblock a goal.

```bash
goalos unblock goal_abc123
```

### prioritize

Interactive priority setting.

```bash
goalos prioritize

# Walks you through all active goals
# Allows you to set priority and deadline for each
```

### tree

Show full goal tree with all details.

```bash
goalos tree

# Focus on a subtree
goalos tree --from goal_abc123

# Show with dependencies
goalos tree --show-deps

# Show with deadlines
goalos tree --show-deadlines
```

### export

Export your intent graph.

```bash
# Export to JSON
goalos export goals.json

# Export to JSON-LD
goalos export goals.jsonld

# Export to CSV (flat)
goalos export goals.csv

# Export with specific goals only
goalos export goals.json --status active
goalos export goals.json --priority critical
```

### import

Import goals from JSON.

```bash
goalos import other-goals.json

# Merge mode (add to existing)
goalos import other-goals.json --merge

# Override mode (replace existing)
goalos import other-goals.json --override
```

### validate

Validate your intent graph.

```bash
goalos validate

# Verbose output
goalos validate --verbose
```

Checks:
- All required fields present
- No circular dependencies
- All parent/dependency references valid
- Valid timestamps
- Valid status values

### serve

Start the MCP server.

```bash
goalos serve

# Custom port
goalos serve --port 3000

# With SQLite backend
goalos serve --storage sqlite --db ~/.goalos/goals.db

# Verbose logging
goalos serve --verbose

# Specific config file
goalos serve --config ~/.goalos/config.json
```

### config

Manage CLI configuration.

```bash
# Show current config
goalos config show

# Set a value
goalos config set store.path ~/.goalos/goals.json
goalos config set default.priority high
goalos config set default.domain work

# Reset to defaults
goalos config reset
```

## Global Options

```bash
# Use different config file
goalos --config ~/my-config.json init

# Use different graph file
goalos --graph ~/my-goals.json list

# Verbose output
goalos --verbose list

# JSON output (for scripting)
goalos --json list
```

## Configuration File

`~/.goalos/config.json`:

```json
{
  "owner": "you@example.com",
  "store": {
    "type": "file",
    "path": "~/.goalos/graph.json"
  },
  "defaults": {
    "priority": "medium",
    "domain": "personal",
    "timeHorizon": "this_month"
  },
  "cli": {
    "outputFormat": "tree",
    "colors": true,
    "timestamps": true
  },
  "mcp": {
    "port": 3000,
    "host": "localhost",
    "verbose": false
  }
}
```

## Examples

```bash
# Typical daily workflow
goalos status --horizon today        # Check today's priorities
goalos list --status active          # Review active goals
goalos add "Daily standup notes"     # Add a quick task
goalos update goal_abc --status active
goalos prioritize                    # Adjust priorities
goalos export daily.json             # Backup

# Weekly review
goalos status --horizon week         # Weekly overview
goalos list --include-completed      # See what you've done
goalos list --status blocked         # Identify blockers
goalos update [blocker] --unblock    # Clear blockers

# Start server for tools
goalos serve                         # Run in background
# Now Claude & other tools can read your goals
```

## Tips & Tricks

- Use `goalos list --format json | jq` for custom filtering
- Pipe to `less` for large lists: `goalos list | less`
- Use `goalos config` to set your defaults
- Backup regularly: `goalos export backup-$(date +%Y%m%d).json`
