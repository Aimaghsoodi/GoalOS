# Contributing

## Prerequisites

- Node.js 18.18+ and `pnpm`
- Python 3.11+ and `uv`

## Setup

```bash
git clone https://github.com/Aimaghsoodi/GoalOS.git
cd GoalOS
pnpm install
```

For the Python SDK:

```bash
cd packages/goalos-py
uv sync --extra dev
```

## Verification

JavaScript packages:

```bash
pnpm --filter @goalos/core typecheck
pnpm --filter @goalos/core lint
pnpm --filter @goalos/core test
pnpm --filter @goalos/core build

pnpm --filter goalos typecheck
pnpm --filter goalos lint
pnpm --filter goalos test
pnpm --filter goalos build

pnpm --filter @goalos/mcp-server typecheck
pnpm --filter @goalos/mcp-server lint
pnpm --filter @goalos/mcp-server test
pnpm --filter @goalos/mcp-server build
```

Python package:

```bash
cd packages/goalos-py
uv run --extra dev pytest
uv run --with build python -m build
```

## Pull requests

- Keep changes scoped and reviewable.
- Update docs when behavior or install paths change.
- Do not commit local build artifacts such as `dist/`, `.venv/`, or `__pycache__/`.
