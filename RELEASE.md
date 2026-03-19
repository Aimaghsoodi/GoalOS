# Release Guide

## What ships

- `@goalos/core` on npm
- `goalos` CLI on npm
- `@goalos/mcp-server` on npm
- `goalos` on PyPI
- GitHub release artifacts for the Python package

## Prerequisites

- GitHub repo admin access
- `NPM_TOKEN` secret configured for npmjs publication
- `PYPI_API_TOKEN` secret configured for PyPI publication

## Tag-based release flow

1. Verify CI is green on `main`.
2. Bump package versions intentionally.
3. Update [CHANGELOG.md](./CHANGELOG.md).
4. Create and push a tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

5. GitHub Actions will:
   - build JS packages
   - build the Python sdist and wheel
   - create a GitHub release
   - publish npm packages if `NPM_TOKEN` exists
   - publish the Python package if `PYPI_API_TOKEN` exists

## Notes

- GitHub Packages is not configured for the current npm package names. The repo currently targets npmjs plus PyPI.
- On Windows network shares, prefer a mapped drive and the hoisted pnpm linker from the repo-level `.npmrc`.
