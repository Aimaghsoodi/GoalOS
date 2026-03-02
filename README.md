# GoalOS: Structured Intent Graphs for AI Agent Alignment

[![npm version](https://img.shields.io/npm/v/@goalos/core.svg)](https://www.npmjs.com/package/@goalos/core)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Your AI tools are powerful. They just don't know what you want.**

GoalOS gives AI agents a shared, structured, machine-readable understanding of your goals, intentions, and priorities. It is the **intent layer** — a graph of what you are trying to achieve, readable and writable by any AI agent.

## Why GoalOS?

Most people use 5+ AI tools daily: Claude, ChatGPT, Cursor, engineering tools, automation agents. Each one optimizes locally with zero awareness of your bigger picture. Your coding agent doesn't know you are raising money on Friday. Your research assistant doesn't know you are pivoting domains next month. **GoalOS bridges that gap.**

With a structured intent graph, every agent in your workflow can read your priorities, update progress, coordinate across tools, and respect constraints you have defined.

## Quick Start

Install the core library:

```bash
npm install @goalos/core
```

5-minute example:

```typescript
import { IntentGraph } from "@goalos/core";

const graph = IntentGraph.create("you@example.com", "Q1 Goals");

const business = graph.addGoal({
  title: "Launch AI consulting business",
  priority: { level: "critical" },
  timeHorizon: "this_quarter",
  successCriteria: ["First client contract signed"],
});

const website = graph.addGoal({
  title: "Build landing page",
  parentId: business.id,
  priority: { level: "high" },
});

graph.addDependency(business.id, {
  type: "requires",
  targetGoalId: website.id,
});

const priorities = graph.getTopPriorities(5);
await graph.toFile("intent-graph.json");
```

Or use the CLI:

```bash
npm install -g goalos

goalos init
goalos add "Launch AI consulting business"
goalos list
goalos status
```

## Package Overview

| Package | Description | Status |
|---------|-------------|--------|
| **@goalos/core** | Core library with goal ops, graphs, dependencies | Production |
| **goalos** (CLI) | Command-line tool for managing intent graphs | Production |
| **@goalos/mcp-server** | Model Context Protocol server for AI agents | Production |
| **@goalos/python-sdk** | Python SDK (PyPI: `goalos`) | Production |

## Core Concepts

**Goals** are your fundamental unit of intent. Each has a title, status (active/planned/blocked/completed), priority level, optional deadline, time horizon, success criteria, and domain.

**Intent Graph** contains all your goals and their relationships. It supports CRUD operations, querying, dependency resolution, cycle detection, and permissions.

**Permissions** control what agents can do. Grant Claude read+write for work goals, but read-only for personal.

**Events** emit when goals change: created, updated, completed, blocked, etc.

## Documentation

- [Quickstart Guide](spec/goalos-quickstart.md)
- [Full Specification](spec/goalos-spec-v0.1.md)
- [MCP Integration](spec/goalos-mcp-integration.md)
- [CLI Reference](spec/goalos-cli-reference.md)
- [Python SDK](spec/goalos-python-sdk.md)
- [JSON Schemas](spec/schema/)

## Examples

See [spec/examples/](spec/examples/):
- personal-project.json - Launching a business
- team-sprint.json - Engineering sprint
- career-transition.json - Career pivot
- content-creator.json - Content pipeline
- health-fitness.json - Health goals

## Development

```bash
git clone https://github.com/AbtinDev/goalos.git
cd goalos
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

## Testing

All packages have >80% test coverage:

```bash
pnpm test:coverage
```

Tests cover public APIs, integration workflows, edge cases, permissions, and conflict resolution.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, code style, testing requirements, and PR process.

**Code of conduct:** Be respectful, give credit, assume good intent.

## Roadmap

**Q2 2024:** Cloud sync, team sharing, mobile app, web dashboard

**Q3 2024:** Browser extension, native integrations, AI-powered suggestions

**Q4 2024:** Commercial tiers, enterprise permissions, API v2

## FAQ

**Q: Is this task management?**
No. Tasks are atomic work items. Goals are what you are trying to achieve. This tracks intentions, not tasks.

**Q: Is this a memory system?**
No. Those store facts. GoalOS stores intentions. It tracks that you are learning Python to build AI agents, not just that you learned Python.

**Q: Is my data private?**
Yes. Intent graphs are stored locally as JSON files by default. You own them.

**Q: Can I use this with teams?**
Yes, v0.1 is optimized for individuals. Team features are coming in Q2 2024.

## License

MIT Licensed. See [LICENSE](LICENSE).

## Support

- Documentation: [spec/](spec/)
- Examples: [examples/](examples/)
- Issues: [GitHub Issues](https://github.com/AbtinDev/goalos/issues)
- Discussions: [GitHub Discussions](https://github.com/AbtinDev/goalos/discussions)

---

Made by [Abtin Dev](https://twitter.com/AbtinDev) and contributors.
