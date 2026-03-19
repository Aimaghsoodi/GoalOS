# Specifications Overview

This repository currently publishes GoalOS reference documentation plus a shared schema directory used by adjacent design work.

## GoalOS

GoalOS defines structured intent graphs: machine-readable goals with priorities, deadlines, dependencies, permissions, and event history.

**Published docs**
- [Quickstart](goalos-quickstart.md)
- [Full specification](goalos-spec-v0.1.md)
- [MCP integration](goalos-mcp-integration.md)
- [CLI reference](goalos-cli-reference.md)
- [Python SDK guide](goalos-python-sdk.md)
- [OpenAPI schema](openapi.yaml)

**Key concepts**
- Hierarchical goals and sub-goals
- Dependencies, blockers, and progress tracking
- Priority scoring and time horizons
- Agent permissions
- Event audit trails
- MCP tooling

## Shared Schemas

The [`schema/`](schema/) directory contains reusable JSON Schemas that support GoalOS and adjacent policy experiments:

- `intent-graph.schema.json`
- `goal.schema.json`
- `dependency.schema.json`
- `event.schema.json`
- `permission.schema.json`
- `capability.schema.json`
- `boundary.schema.json`
- `obligation.schema.json`
- `verification.schema.json`
- `risk-signal.schema.json`

## Examples

GoalOS example graphs live in [`examples/`](examples/):

- `career-transition.json`
- `content-creator.json`
- `health-fitness.json`
- `personal-project.json`
- `team-sprint.json`

## Status

Dedicated FailSafe and AgentSpec prose guides are not yet published in this repository. Until those documents exist, treat the non-GoalOS schemas as experimental building blocks rather than stable standalone products.
