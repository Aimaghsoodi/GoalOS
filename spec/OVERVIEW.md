# Specifications Overview

Complete documentation for GoalOS, FailSafe, and AgentSpec.

## GoalOS - Structured Intent Graphs

Machine-readable goals with priorities, deadlines, dependencies.

**Key Docs:**
- [Quickstart](goalos-quickstart.md)
- [Full Spec](goalos-spec-v0.1.md)
- [MCP Integration](goalos-mcp-integration.md)
- [CLI Reference](goalos-cli-reference.md)
- [Python SDK](goalos-python-sdk.md)

**Concepts:**
- Goals with priorities, deadlines, success criteria
- Hierarchical goal trees
- Dependencies and blockers
- Permissions for agents
- Event audit trail
- MCP integration

**MCP Tools (9):**
1. goalos_get_context
2. goalos_list_goals
3. goalos_get_priorities
4. goalos_get_goal
5. goalos_add_goal
6. goalos_update_goal
7. goalos_complete_goal
8. goalos_add_dependency
9. goalos_search

## FailSafe - Failure Detection

Structured failure reporting and analysis.

**Key Docs:**
- [Quickstart](failsafe-quickstart.md)
- [Taxonomy](taxonomy/failure-taxonomy-v0.1.md)
- [API Reference](failsafe-api-reference.md)

**Concepts:**
- Failure reports with full context
- 15+ failure categories
- Root cause analysis
- Pattern matching
- Prevention signals
- Audit trails

**Categories:**
- Factual errors (hallucinations)
- Reasoning errors
- Temporal errors
- Domain errors
- Safety errors
- Interaction errors

## AgentSpec - Boundary Enforcement

Define and enforce agent capabilities and constraints.

**Key Docs:**
- [Quickstart](agentspec-quickstart.md)
- [Language Ref](agentspec-lang-v0.1.md)
- [Inheritance](../inheritance-model.md)
- [CLI Reference](agentspec-cli-reference.md)

**Concepts:**
- YAML-based specification language
- Capabilities (what agents can do)
- Boundaries (what agents cannot do)
- Obligations (what agents must do)
- Hierarchical composition
- Formal conflict resolution
- Verification testing

**CLI Commands (10):**
1. validate - Check spec validity
2. test - Run verification tests
3. check-capability - Verify capability
4. check-boundary - Verify boundary
5. enforce - Generate enforcer
6. compile - Compile to formats
7. show-inheritance - Visualize inheritance
8. diff - Compare specs
9. lint - Check practices
10. docs - Generate docs

## Examples

All projects include realistic examples:
- GoalOS: 5 life/work scenarios
- FailSafe: 10 failure case studies
- AgentSpec: 10 agent configurations
