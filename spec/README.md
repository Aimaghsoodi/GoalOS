# AgentSpec Specification

This directory contains the complete specification for **AgentSpec** — a framework for defining, composing, and enforcing agent capabilities, boundaries, obligations, and verification rules. AgentSpec enables AI agents to operate within human-defined constraints while maintaining transparency, safety, and accountability.

## Contents

- **agentspec-lang-v0.1.md** — Full language specification (4000+ words) with all constructs, semantics, and examples
- **inheritance-model.md** — Detailed inheritance and composition semantics (depth-first, left-to-right, most-restrictive-wins)
- **conflict-resolution.md** — Formal conflict resolution rules and algorithm
- **schema/** — JSON Schema definitions for validation
  - `agentspec.schema.json` — Schema for complete AgentSpec documents
  - `capability.schema.json` — Schema for capability definitions
  - `boundary.schema.json` — Schema for boundary constraints
  - `obligation.schema.json` — Schema for agent obligations
  - `verification.schema.json` — Schema for verification and testing rules
- **examples/** — 10 realistic AgentSpec configurations in YAML format
  - `basic-assistant.yaml` — Simple assistant with basic capabilities
  - `company-base-policy.yaml` — Company-wide agent policy (base specification)
  - `retail-division.yaml` — Retail division policy inheriting from company base
  - `compliance-agent.yaml` — Compliance-focused agent with strict boundaries
  - `customer-service.yaml` — Customer service agent with permission boundaries
  - `data-analyst.yaml` — Data analysis agent with data access limits
  - `code-review-bot.yaml` — Code review automation agent
  - `content-moderator.yaml` — Content moderation with domain restrictions
  - `financial-advisor.yaml` — Financial advice agent with fiduciary obligations
  - `research-assistant.yaml` — Research assistant with citation obligations

## Quick Start

1. Read `agentspec-lang-v0.1.md` for the complete language specification
2. Review `inheritance-model.md` to understand composition and inheritance
3. Check `conflict-resolution.md` for how conflicting rules are resolved
4. Explore `examples/` to see how AgentSpec is applied in real scenarios
5. Use `schema/` files to validate your own AgentSpec documents

## Specification Versions

- **v0.1.0** (current) — Initial release with core constructs: capabilities, boundaries, obligations, verification

## Key Concepts

### Capabilities
Define what an agent is allowed to do:
- Tool access (reading, writing, executing)
- Information access (data types, domains)
- Action execution limits
- Resource constraints

### Boundaries
Enforce what an agent CANNOT do:
- Absolute restrictions (do not access this data)
- Conditional restrictions (only in these contexts)
- Domain-specific boundaries (health, finance, legal)
- Rate and quota limits

### Obligations
Define responsibilities and requirements:
- Citation requirements for information sources
- Transparency obligations (explain reasoning)
- Logging and audit requirements
- User consent and disclosure rules

### Verification
Enable testing and validation:
- Capability test suites
- Boundary violation detection
- Obligation compliance checking
- Formal verification rules

## Design Principles

- **Composition** — Specs inherit from parents and merge with siblings, enabling policy reuse
- **Clarity** — Human-readable YAML with clear semantics
- **Enforcement** — Boundaries are hard constraints (must be enforced at runtime)
- **Transparency** — Obligations require agents to explain their actions
- **Extensibility** — Domain-specific extensions for specialized fields
- **Conflict Resolution** — Deterministic rules for merging and resolving conflicts (most-restrictive-wins)

## Use Cases

- **Agent Governance** — Define what AI agents can/cannot do in your organization
- **Policy Enforcement** — Implement compliance policies (GDPR, HIPAA, etc.)
- **Team Coordination** — Share agent specifications across teams and projects
- **Safety** — Create boundaries preventing misuse or harmful actions
- **Transparency** — Require agents to explain decisions and cite sources
- **Testing** — Validate agents conform to specifications before deployment

## File Format

AgentSpec documents are written in YAML with strong JSON Schema validation. This enables both human readability and machine validation.

```yaml
apiVersion: agentspec.io/v1
kind: AgentSpec
metadata:
  name: example-agent
  namespace: default
spec:
  capabilities:
    - name: read_documents
      resources: [files]
      actions: [read]
      limit: 1000
  boundaries:
    - name: no_pii_access
      applies_to: [read_documents]
      deny_if:
        - contains_pii: true
  obligations:
    - name: cite_sources
      applies_to: [read_documents]
      require: source_citations
  verification:
    - name: test_boundary_enforcement
      test_type: boundary_check
      target: no_pii_access
```

## Inheritance Example

```yaml
# company-base-policy.yaml
spec:
  capabilities:
    - name: basic_communication
      resources: [email, chat]
      actions: [send, read]

# retail-division.yaml
inherits_from: company-base-policy.yaml
spec:
  capabilities:
    - name: access_customer_data
      resources: [customer_database]
      actions: [read]
      limit: 1000000  # 1MB per request
  boundaries:
    - name: pci_compliance
      deny_patterns: [credit_card_numbers]
```

When retail-division is evaluated:
1. Start with company-base-policy capabilities
2. Add retail-division capabilities
3. Apply boundaries from both (most-restrictive-wins)
4. Resolve conflicts using conflict resolution algorithm

## Validating AgentSpec Documents

All example YAML files validate against the JSON schemas:

```bash
# Validate a single spec
ajv validate -s spec/schema/agentspec.schema.json -d spec/examples/company-base-policy.yaml

# Validate all examples
for file in spec/examples/*.yaml; do
  ajv validate -s spec/schema/agentspec.schema.json -d "$file" || echo "Failed: $file"
done
```

## Contributing

This specification is maintained as part of the GoalOS ecosystem. To contribute:

1. Propose changes via GitHub issues
2. Create example specs demonstrating new constructs
3. Update schemas and validation rules
4. Add comprehensive test cases

## License

MIT — See LICENSE at project root.
