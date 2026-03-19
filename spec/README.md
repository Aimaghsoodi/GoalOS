# GoalOS Specification Workspace

This directory contains the published GoalOS reference specification and the schema files that support it.

## Published GoalOS docs

- `goalos-spec-v0.1.md` — the canonical specification
- `goalos-quickstart.md` — implementation quickstart
- `goalos-cli-reference.md` — CLI command reference
- `goalos-mcp-integration.md` — MCP usage and tool surface
- `goalos-python-sdk.md` — Python package guide
- `openapi.yaml` — API schema for integrations

## Schema directory

The [`schema/`](schema/) folder contains the JSON Schemas used by GoalOS plus several experimental policy-oriented building blocks:

- Goal graph schemas:
  - `intent-graph.schema.json`
  - `goal.schema.json`
  - `dependency.schema.json`
  - `event.schema.json`
  - `permission.schema.json`
- Policy-oriented schemas:
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

## Validation

You can validate an intent graph against the published schema with `ajv`:

```bash
ajv validate -s spec/schema/intent-graph.schema.json -d spec/examples/personal-project.json
```

## Status

The repository does not currently publish standalone FailSafe or AgentSpec prose documentation. If you build on the policy-oriented schema files, treat them as experimental until dedicated docs and examples are added.

## License

MIT — See [`LICENSE`](../LICENSE).
