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

1. **Update version** in `package.json` (semver):

   ```bash
   # Option A: Manual edit
   # Edit "version": "0.1.2" in package.json

   # Option B: Auto-bump (recommended)
   npm version patch   # or minor, major
   ```

2. **Commit the version bump**:

   ```bash
   git push
   ```

3. **Tag and release**:

   ```bash
   npm run release
   ```

   This creates and pushes a tag (e.g. `v0.1.2`), which triggers the CI workflow to publish to:
   - Open VSX Registry
   - Visual Studio Marketplace

   The workflow packages once and publishes to both registries with the same `.vsix`.

### Version Numbering

Use [semantic versioning](https://semver.org/):
- `patch` — bug fixes (0.1.2 → 0.1.3)
- `minor` — new features (0.1.2 → 0.2.0)
- `major` — breaking changes (0.1.2 → 1.0.0)

## Manual Publish (without CI)

```bash
# VS Marketplace
vsce publish

# Open VSX
ovsx publish
```

## CI/CD

The [deploy workflow](.github/workflows/cicd.yml) runs on every tag push and publishes to both registries automatically.