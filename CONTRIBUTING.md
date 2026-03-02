# Contributing to GoalOS, FailSafe, and AgentSpec

We love contributions! This document provides guidelines for all three projects.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `pnpm install`
4. Create a feature branch: `git checkout -b feature/my-feature`
5. Make your changes
6. Run tests: `pnpm test`
7. Run linter: `pnpm lint`
8. Commit with conventional commits: `git commit -m "feat: add new feature"`
9. Push and create a Pull Request

## Code of Conduct

- Be respectful and inclusive
- Give credit to others
- Report issues privately if they're security-related
- Assume good intent

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run specific package tests
pnpm -F @goalos/core test

# Build all packages
pnpm build

# Watch mode
pnpm -F @goalos/core dev
```

### Structure

Each project has its own package in `packages/`:
- Source code: `src/`
- Tests: `tests/`
- Configuration: `package.json`, `tsconfig.json`, `vitest.config.ts`

### Conventions

- Use TypeScript strictly (`strict: true`)
- Write tests for all public APIs
- Use meaningful commit messages
- Follow existing code style
- Add JSDoc comments for public functions

### Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test -- goal.test.ts

# Watch mode
pnpm test -- --watch
```

Minimum coverage: 80% for all packages

### Commit Messages

Use conventional commits:

```
feat: add new feature
fix: fix a bug
docs: update documentation
refactor: refactor code
test: add tests
perf: improve performance
```

Example:
```
feat(goalos): add goal completion tracking

- Track when goals are completed
- Update parent progress automatically
- Emit completion events
```

## Pull Request Process

1. Update CHANGELOG.md with your changes
2. Ensure all tests pass: `pnpm test`
3. Ensure linting passes: `pnpm lint`
4. Ensure types check: `pnpm typecheck`
5. Write a clear PR description
6. Request review from maintainers
7. Address feedback
8. Squash commits if requested

### PR Description Template

```markdown
## Description
What does this PR do?

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Performance improvement
- [ ] Breaking change

## Related Issues
Closes #123

## Testing
How was this tested?

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Types check
- [ ] Documentation updated
- [ ] CHANGELOG updated
```

## Documentation

- Update inline JSDoc comments
- Update relevant `.md` files in `spec/`
- Add examples in code and docs
- Keep docs current with code

## Issues

Before starting work:

1. Check if issue already exists
2. Comment on issue to claim it
3. Wait for feedback from maintainers
4. Ask questions if unclear

### Issue Types

- **Bug Report**: Something not working
- **Feature Request**: New capability
- **Documentation**: Docs improvement
- **Question**: Need help understanding something

## Release Process

Only maintainers can release, but here's the process:

```bash
# Update version
npm version minor

# Build all packages
pnpm build

# Test everything
pnpm test

# Publish to npm (for each package)
pnpm -F @goalos/core publish
pnpm -F @goalos/cli publish
pnpm -F @goalos/mcp-server publish

# Push tags
git push origin main --tags

# Update CHANGELOG.md
```

## Architecture Notes

### GoalOS

- No external dependencies in core
- Focuses on graph operations
- Clean separation of concerns (types, validation, query, etc.)
- MCP server is separate package

### FailSafe

- Core has minimal dependencies
- Taxonomy is the source of truth
- Patterns emerge from failure data
- SDK handles HTTP client

### AgentSpec

- Core handles parsing and validation
- Enforcer is separate for runtime
- Inheritance is explicit, not implicit
- Conflict resolution is deterministic

## Questions?

- Open an issue for questions
- Join our Discord: discord.gg/goalos
- Email: support@goalos.dev

## Recognition

All contributors are recognized in:
- GitHub contributors page
- Release notes
- Project README

Thank you for contributing!
