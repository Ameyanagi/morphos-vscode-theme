# Development

This fork uses Bun. Generated theme JSON is written to `dist/` at build time instead of being committed as source.

## Commands

Install dependencies:

```bash
bun install
```

Run the theme generator:

```bash
bun run generate
```

Format TypeScript sources:

```bash
bun run format
```

Check formatting:

```bash
bun run format:check
```

Lint:

```bash
bun run lint
```

Validate generated themes:

```bash
bun run test
```

Typecheck:

```bash
bun run typecheck
```

Package a VSIX:

```bash
bun run package
```

## Pre-commit Hook

`bun install` runs Husky through the `prepare` script and installs the tracked pre-commit hook.

The hook runs:

```bash
bun run precommit
```

That command regenerates the theme into `dist/`, checks source formatting with Oxfmt, lints with Oxlint, typechecks, and validates generated theme metadata.

## Source Data

The generator reads `src/data/systems.json` from the Morphos git repository. If `../morphos` exists locally, it uses `git show`; otherwise it uses a sparse, filtered clone of `https://github.com/Ameyanagi/morphos.git`.

Environment overrides:

```bash
MORPHOUS_REPO_PATH=../morphos bun run generate
MORPHOUS_REPO_URL=https://github.com/Ameyanagi/morphos.git MORPHOUS_REF=main bun run generate
```

Generated output:

```text
dist/package.json
dist/themes/*.json
dist/morphos-vscode-theme-*.vsix
```

## GitHub Actions Publishing

Add a repository secret named `VSCE_PAT` with an Azure DevOps Personal Access Token that has:

```text
Organization: All accessible organizations
Scope: Marketplace -> Manage
```

Then run the manual workflow:

```text
Actions -> Publish VS Code Extension -> Run workflow
```

Use `skip_publish=true` to build, upload the VSIX artifact, and verify the Marketplace PAT without publishing. By default, the workflow generates themes from `https://github.com/Ameyanagi/morphos.git` at `main`.
