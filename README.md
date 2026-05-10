# Morphous Theme for VS Code

This fork packages VS Code-compatible color themes generated from the Morphos design-system catalog.

The extension source stays small: generated theme JSON is written to `dist/` at build time instead of being committed as source. Morphos remains the catalog source of truth.

## Source Data

The generator reads Morphos catalog data from a git repository:

- Default local source, when available: `../morphos` at ref `main`
- Default remote source: `https://github.com/Ameyanagi/morphos.git` at ref `main`

It reads only:

```text
src/data/systems.json
```

For remote generation, the script uses a sparse, filtered clone so the large Morphos asset tree is not downloaded.

Environment overrides:

```bash
MORPHOUS_REPO_PATH=../morphos bun run generate
MORPHOUS_REPO_URL=https://github.com/Ameyanagi/morphos.git MORPHOUS_REF=main bun run generate
```

## Commands

Install dependencies:

```bash
bun install
```

Generate the extension package directory:

```bash
bun run generate
```

Validate generated themes:

```bash
bun run test
```

Typecheck the generator:

```bash
bun run typecheck
```

Create a VSIX package:

```bash
bun run package
```

The generated extension lives in:

```text
dist/
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

## Output

For each Morphos system, the generator creates four VS Code themes:

- Dark
- Dark Boosted
- Light
- Light Boosted

The generated `dist/package.json` receives the full `contributes.themes` list, and `dist/themes/` receives the generated theme JSON files.

## Attribution

This repository preserves and continues the original `morphos-vscode-theme` extension work. The theme generator maps Morphos palette roles to VS Code workbench colors and TextMate token scopes, with boosted variants that increase syntax contrast while preserving motif hue identity.

See [NOTICE.md](NOTICE.md) for attribution details.

## License

MIT. Morphos design-system data and generated catalog content belong to the Morphos project and its authors.
