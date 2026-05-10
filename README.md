# Morphous Theme for VSCode & Compatible Editors

Original extension concept and generator work by AquiTCD. This fork preserves that work as a separate repository and keeps the extension generated from the upstream Morphos catalog.

A collection of **2,440 VSCode-compatible color themes** compiled from the [Ameyanagi/morphos](https://github.com/Ameyanagi/morphos) design system.

This project contains a **Bun + TypeScript** generator that reads 610+ motifs from the upstream Morphos git repository and compiles them into **2,440 themes** (Standard and Boosted variants in both Dark and Light modes for each of the 610 motifs).

---

## Discovering Theme Motifs & Palettes

To explore the rich nature-inspired color schemes and find your favorite motif:
1. Visit the official **[Morphos Catalog Website](https://morphos.ameyanagi.com)**.
2. Search through the 610+ gorgeous motifs (animals, plants, minerals, weather, and landscapes).
3. Identify the name of the motif you love, then select the corresponding **`Morphous <Motif Name>`** theme in your editor.

---

## Core Concept

This extension maps the color roles of the Morphos design system to VSCode workbench elements and TextMate syntax scopes to maintain contrast and legibility.

The 9 semantic color roles of [Ameyanagi/morphos](https://github.com/Ameyanagi/morphos) are mapped to VSCode and compatible editor workbench elements as follows:

### Color Role Mapping

| Morphos Role | VSCode Element & Semantics | Visual Intention |
| :--- | :--- | :--- |
| **Depth** | Editor deepest background, activity bar background, panel borders | Used for workbench backgrounds to reduce visual weight |
| **Background** | Main editor background, standard text, variable names | Used for the main editor background and default text |
| **Ink** | Sidebars, status bars, panel backgrounds | Used for sidebars and panels to provide structure |
| **Primary** | Function definitions, method calls, focus indicators, cursor | Used for functions, methods, and active workbench states |
| **Secondary** | Control flow keywords, tags, XML/HTML markup | Used for control flow keywords and markup tags |
| **Accent** | Strings, type names, class names, interfaces | Used for strings, classes, and types |
| **Signal** | Numbers, constants, booleans, error diagnostics, Git deletions | Used for numbers, constants, booleans, and diagnostics |
| **Surface** | Inputs, list selections, active item highlights, minimap | Used for selections, inputs, and active list items |
| **Muted** | Comments, inactive text, line numbers, subtle borders | Used for comments and line numbers |

### Typography & Styling

- **Italic Typography**: Storage keywords (`const`, `let`, `class`, `function`), comments, and parameters are italicized across all themes to differentiate them from standard variables and bold control-flow keywords.

---

## Boosted Themes (Contrast Adjustments)

The **Standard** themes preserve the original color roles of the Morphos design system. However, they can have low contrast in some programming environments.

The **Boosted** (`-boosted`) variants increase contrast and adjust lightness levels for syntax highlighting while preserving the original hue angles of each motif.

### Adjustments in Boosted Themes

1. **Reverse-Phase Background Contrast Shift**:
   To improve contrast without modifying foreground saturations, the background and sidebar colors are shifted in the opposite direction (4% darker in Dark mode, 3% lighter in Light mode).
2. **Hue-Preserving Lightness Levels**:
   The hue angle of each motif is preserved. Saturation is unified, and syntax colors are mapped to specific lightness levels:
   - **Dark Mode**: Secondary (Keywords -> 70%), Primary (Functions -> 66%), Accent (Strings -> 62%), Signal (Constants -> 73%).
   - **Light Mode**: Secondary (Keywords -> 32%), Primary (Functions -> 36%), Accent (Strings -> 40%), Signal (Constants -> 28%).

---

## Installation & Local Usage

Install the published extension from the VS Code Marketplace once available, or build a local VSIX from this fork:

```bash
bun install
bun run package
```

Then install the generated package:

```bash
code --install-extension dist/morphos-vscode-theme-1.0.0.vsix
```

For compatible editors such as Cursor or VSCodium, install the same VSIX through the editor's extension UI or command-line extension installer.

After installation, press `Cmd+K` then `Cmd+T` (or `Ctrl+K` `Ctrl+T`) to open the Theme Selector. Type **`Morphous`** to filter through the generated custom theme options (for example, `Morphous Aurora (Dark)` or `Morphous Glacier (Light)`).

---

## Generator & Developer Guide

This fork uses Bun. Generated theme JSON is written to `dist/` at build time instead of being committed as source.

### 1. Install Dependencies

```bash
bun install
```

### 2. Run Theme Generator

```bash
bun run generate
```

### 3. Run Validation Tests

```bash
bun run test
```

### 4. Typecheck

```bash
bun run typecheck
```

### 5. Package VSIX

```bash
bun run package
```

---

## Under the Hood (Technical Architecture)

- **Morphos Git Repository Source**: The generator reads `src/data/systems.json` from the Morphos git repository. If `../morphos` exists locally, it uses `git show`; otherwise it uses a sparse, filtered clone of `https://github.com/Ameyanagi/morphos.git`.
- **Generated Extension Output**: `dist/package.json` receives the complete VSCode `contributes.themes` list, and `dist/themes/` receives the generated theme JSON files.
- **On-Demand Loading**: VSCode and compatible editors load active themes dynamically from disk, ensuring that hosting over 2,400 themes incurs zero performance overhead on startup or memory footprint.
- **TypeScript Implementation**: The generator is written in TypeScript and executed by Bun.

Environment overrides:

```bash
MORPHOUS_REPO_PATH=../morphos bun run generate
MORPHOUS_REPO_URL=https://github.com/Ameyanagi/morphos.git MORPHOUS_REF=main bun run generate
```

---

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

---

## Attribution

This repository is a fork-based continuation of the original `morphos-vscode-theme` work by AquiTCD.

The original project implemented the Morphos-to-VSCode theme generator, including the workbench color mapping, TextMate syntax mapping, standard and boosted theme variants, and extension contribution generation. This fork keeps that work as a separate extension repository while changing the data source to the Morphos git repository so the extension can be regenerated from the canonical catalog without vendoring the main Morphos asset tree.

See [NOTICE.md](NOTICE.md) for attribution details.

---

## License

This project is licensed under the MIT License.  
The Morphous design system and color palettes are copyrighted by [Ameyanagi](https://github.com/Ameyanagi).
