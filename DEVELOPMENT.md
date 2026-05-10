# Development

This fork uses Bun. Generated theme JSON is written to `dist/` and committed so tags contain the exact theme files being published.

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

Publishing runs from git tags only. To publish a release, commit the generated `dist/` output, create a version tag, and push the tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The manual workflow also requires a tag input and checks out that tag before building. Use `skip_publish=true` to build, upload the VSIX artifact, and verify the Marketplace PAT without publishing. The workflow regenerates `dist/` before packaging and fails if the generated files differ from the committed tag.
