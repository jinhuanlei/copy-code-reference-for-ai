# Contributing

## Development

```bash
npm install
npm run watch    # watch mode with hot reload
npm test         # run tests
```

## Running Tests

```bash
npm test
```

## Linting & Type Checking

```bash
npm run check-types
npm run lint
```

## Building

```bash
npm run compile     # type-check, lint, and bundle
npm run package    # production build (creates .vsix)
```

## Releasing

### Prerequisites

Add these secrets in **GitHub → Settings → Secrets and variables → Actions**:

- `VS_MARKETPLACE_TOKEN` — Azure DevOps PAT for VS Code Marketplace
- `OPEN_VSX_TOKEN` — Open VSX access token

### Release Steps

1. **Bump version**:

   ```bash
   npm version patch   # or minor, major
   ```

   This auto-bumps the version in `package.json`, creates a commit, and adds a local tag.

2. **Push to trigger CI**:

   ```bash
   git push && git push --tags
   ```

   This pushes the commit + tag, triggering the CI workflow to publish to:
   - Open VSX Registry
   - Visual Studio Marketplace

### Version Numbering

Use [semantic versioning](https://semver.org/) with `npm version`:
- `npm version patch` — bug fixes (0.1.2 → 0.1.3)
- `npm version minor` — new features (0.1.2 → 0.2.0)
- `npm version major` — breaking changes (0.1.2 → 1.0.0)

## Manual Publish (without CI)

```bash
# VS Marketplace
vsce publish

# Open VSX
ovsx publish
```

## CI/CD

The [deploy workflow](.github/workflows/cicd.yml) runs on every tag push and publishes to both registries automatically.