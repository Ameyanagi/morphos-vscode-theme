# Morphous Theme for VSCode & Compatible Editors

A collection of **2,440 VSCode-compatible color themes** compiled from the [Ameyanagi/morphos](https://github.com/Ameyanagi/morphos) design system.

This project contains a **Node.js (TypeScript + tsx)** generator that fetches 610+ motifs from the upstream repository and compiles them into **2,440 themes** (Standard and Boosted variants in both Dark and Light modes for each of the 610 motifs).

---

## 🎨 Discovering Theme Motifs & Palettes

To explore the rich nature-inspired color schemes and find your favorite motif:
1. Visit the official **[Morphos Catalog Website](https://morphos.ameyanagi.com)**.
2. Search through the 610+ gorgeous motifs (animals, plants, minerals, weather, and landscapes).
3. Identify the name of the motif you love, then select the corresponding **`Morphous <Motif Name>`** theme in your editor!

---

## 🌿 Core Concept

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

## ⚡ Boosted Themes (Contrast Adjustments)

The **Standard** themes preserve the original color roles of the Morphos design system. However, they can have low contrast in some programming environments.

The **Boosted** (`-boosted`) variants increase contrast and adjust lightness levels for syntax highlighting while preserving the original hue angles of each motif.

### Adjustments in Boosted Themes:

1. **Reverse-Phase Background Contrast Shift**:
   To improve contrast without modifying foreground saturations, the background and sidebar colors are shifted in the opposite direction (4% darker in Dark mode, 3% lighter in Light mode).
2. **Hue-Preserving Lightness Levels**:
   The hue angle of each motif is preserved. Saturation is unified, and syntax colors are mapped to specific lightness levels:
   - **Dark Mode**: Secondary (Keywords $\rightarrow 70\%$), Primary (Functions $\rightarrow 66\%$), Accent (Strings $\rightarrow 62\%$), Signal (Constants $\rightarrow 73\%$).
   - **Light Mode**: Secondary (Keywords $\rightarrow 32\%$), Primary (Functions $\rightarrow 36\%$), Accent (Strings $\rightarrow 40\%$), Signal (Constants $\rightarrow 28\%$).

---

## 🚀 Installation & Local Usage

Since the generated themes are fully compatible with standard VSCode and other compatible editors (such as Cursor, Antigravity, or VSCodium), you can load them by symlinking the repository to your extensions directory.

### 1. Create a Symbolic Link

Run the corresponding command depending on your target editor:

```bash
# For VSCode
mkdir -p ~/.vscode/extensions
ln -sfn "$(pwd)" ~/.vscode/extensions/morphos-vscode-theme

# For Cursor
mkdir -p ~/.cursor/extensions
ln -sfn "$(pwd)" ~/.cursor/extensions/morphos-vscode-theme

# For Antigravity IDE
mkdir -p ~/.antigravity/extensions
ln -sfn "$(pwd)" ~/.antigravity/extensions/morphos-vscode-theme
```

### 2. Reload Your Editor
Reload or restart your IDE:
- Open the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
- Run `Developer: Reload Window` to apply changes.

### 3. Select a Theme
Press `Cmd+K` then `Cmd+T` (or `Ctrl+K` `Ctrl+T`) to open the Theme Selector.  
Type **`Morphous`** to filter through the 2,440 custom theme options (e.g., `Morphous Aurora (Dark)` or `Morphous Glacier (Light)`).

---

## 🛠️ Generator & Developer Guide

The generator runs on Node.js using `tsx` to execute TypeScript files directly.

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Theme Generator (generate)
This fetches motif definitions from the upstream repository and generates 2,440 JSON theme files in `themes/` while updating `package.json`.
```bash
npm run generate
```

### 3. Run Validation Tests (test)
Runs the test suite to verify all JSON files are schema-compliant and syntactically correct.
```bash
npm run test
```

---

## 🧬 Under the Hood (Technical Architecture)

- **GitHub Trees API Integration**: The generator queries the `/git/trees` API with `recursive=1` to list and fetch all files in a single request.
- **On-Demand Loading**: VSCode and compatible editors load active themes dynamically from disk, ensuring that hosting over 2,400 themes incurs zero performance overhead on startup or memory footprint.
- **TypeScript Implementation**: The generator is written in TypeScript to enforce type safety during color conversion and JSON schema generation.

---

## 📝 License
This project is licensed under the MIT License.  
The Morphous design system and color palettes are copyrighted by [Ameyanagi](https://github.com/Ameyanagi).
