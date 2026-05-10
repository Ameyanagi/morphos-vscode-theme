import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { spawnSync } from "child_process";

export type ThemeMode = "dark" | "light";

interface PaletteItem {
  role: string;
  name?: string;
  hex: string;
}

export interface MorphousSystem {
  slug: string;
  name?: string;
  motifName?: string;
  palette: PaletteItem[];
}

interface ThemeContribution {
  label: string;
  uiTheme: "vs-dark" | "vs-light";
  path: string;
}

interface RoleDefinition {
  key: keyof ThemePalette;
  aliases: string[];
  fallbackIndex: number;
}

export interface ThemePalette {
  background: string;
  ink: string;
  primary: string;
  secondary: string;
  accent: string;
  signal: string;
  surface: string;
  muted: string;
  depth: string;
}

export interface GenerateResult {
  systems: MorphousSystem[];
  contributions: ThemeContribution[];
  distDir: string;
  themesDir: string;
}

const CATALOG_PATH = "src/data/systems.json";
const DEFAULT_REPO_URL = "https://github.com/Ameyanagi/morphos.git";
const DEFAULT_REF = "main";
const GIT_MAX_BUFFER = 128 * 1024 * 1024;

const roleDefinitions: RoleDefinition[] = [
  { key: "background", aliases: ["Background"], fallbackIndex: 0 },
  { key: "ink", aliases: ["Ink", "Foreground", "Text", "Body", "Dark Text"], fallbackIndex: 1 },
  { key: "primary", aliases: ["Primary", "Action", "Interactive"], fallbackIndex: 2 },
  {
    key: "secondary",
    aliases: ["Secondary", "Support", "Tertiary", "Focus", "Ring", "Active"],
    fallbackIndex: 3
  },
  {
    key: "accent",
    aliases: ["Accent", "Highlight", "Glow", "Data", "Warm Accent", "Soft Accent"],
    fallbackIndex: 4
  },
  {
    key: "signal",
    aliases: ["Signal", "Status", "Warning", "Caution", "Danger", "Alert", "Error", "Risk", "Destructive"],
    fallbackIndex: 5
  },
  {
    key: "surface",
    aliases: ["Surface", "Card", "Panel", "Popover", "Input", "Field", "Command Surface", "Soft Surface"],
    fallbackIndex: 6
  },
  {
    key: "muted",
    aliases: ["Muted", "Muted Foreground", "Neutral", "Neutral Mid", "Subtle", "Quiet", "Soft", "Fog", "Mist"],
    fallbackIndex: 3
  },
  {
    key: "depth",
    aliases: ["Depth", "Deep", "Dark Background", "Night", "Shadow", "Dark Card", "Dark Surface"],
    fallbackIndex: 1
  }
];

const variants = [
  { mode: "dark" as const, boosted: false, uiTheme: "vs-dark" as const, suffix: "dark", labelMode: "Dark" },
  { mode: "dark" as const, boosted: true, uiTheme: "vs-dark" as const, suffix: "boosted-dark", labelMode: "Dark" },
  { mode: "light" as const, boosted: false, uiTheme: "vs-light" as const, suffix: "light", labelMode: "Light" },
  { mode: "light" as const, boosted: true, uiTheme: "vs-light" as const, suffix: "boosted-light", labelMode: "Light" }
];

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  h /= 360;

  let r = l;
  let g = l;
  let b = l;

  if (s !== 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    r = hue2rgb(h + 1 / 3);
    g = hue2rgb(h);
    b = hue2rgb(h - 1 / 3);
  }

  const toHex = (x: number) => {
    const val = Math.round(x * 255).toString(16);
    return val.length === 1 ? "0" + val : val;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function git(args: string[], cwd = process.cwd()): string {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: GIT_MAX_BUFFER
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || result.stdout.trim() || `git ${args.join(" ")} failed`);
  }

  return result.stdout;
}

function repoPathFromEnvOrSibling(): string | undefined {
  if (process.env.MORPHOUS_REPO_PATH) {
    return path.resolve(process.env.MORPHOUS_REPO_PATH);
  }

  if (process.env.MORPHOUS_REPO_URL) {
    return undefined;
  }

  const sibling = path.resolve(process.cwd(), "..", "morphos");
  if (fs.existsSync(path.join(sibling, ".git"))) {
    return sibling;
  }

  return undefined;
}

function readCatalogFromLocalGit(repoPath: string, ref: string): string {
  return git(["-C", repoPath, "show", `${ref}:${CATALOG_PATH}`]);
}

function readCatalogFromRemoteGit(repoUrl: string, ref: string): string {
  const cacheParent = path.join(process.cwd(), ".cache");
  const cacheDir = path.join(cacheParent, `morphous-${Date.now()}-${process.pid}`);
  fs.mkdirSync(cacheParent, { recursive: true });

  try {
    git(["clone", "--filter=blob:none", "--sparse", "--no-checkout", repoUrl, cacheDir]);
    git(["-C", cacheDir, "sparse-checkout", "set", "--no-cone", CATALOG_PATH]);
    git(["-C", cacheDir, "fetch", "--depth=1", "origin", ref]);
    git(["-C", cacheDir, "checkout", "--detach", "FETCH_HEAD"]);
    return fs.readFileSync(path.join(cacheDir, CATALOG_PATH), "utf8");
  } finally {
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
}

export function loadMorphousSystems(): MorphousSystem[] {
  const ref = process.env.MORPHOUS_REF || DEFAULT_REF;
  const repoPath = repoPathFromEnvOrSibling();
  const catalogJson = repoPath
    ? readCatalogFromLocalGit(repoPath, ref)
    : readCatalogFromRemoteGit(process.env.MORPHOUS_REPO_URL || DEFAULT_REPO_URL, ref);

  const systems = JSON.parse(catalogJson) as MorphousSystem[];
  if (!Array.isArray(systems) || systems.length === 0) {
    throw new Error(`No Morphous systems found in ${CATALOG_PATH}`);
  }

  return systems;
}

function normalizedRole(role: string): string {
  return role.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function assertHex(hex: string, context: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(`${context} must be a 6-digit hex color, got ${hex}`);
  }
  return hex;
}

function pickPaletteColor(system: MorphousSystem, definition: RoleDefinition): string {
  if (!system.palette.length) {
    throw new Error(`${system.slug} has no palette entries`);
  }

  const entries = new Map(system.palette.map((entry) => [normalizedRole(entry.role), entry]));
  for (const alias of definition.aliases) {
    const match = entries.get(normalizedRole(alias));
    if (match?.hex) {
      return assertHex(match.hex, `${system.slug} ${definition.key}`);
    }
  }

  const fallback = system.palette[definition.fallbackIndex] ?? system.palette[0];
  return assertHex(fallback.hex, `${system.slug} ${definition.key} fallback`);
}

export function resolveThemePalette(system: MorphousSystem): ThemePalette {
  const palette = {} as ThemePalette;
  for (const definition of roleDefinitions) {
    palette[definition.key] = pickPaletteColor(system, definition);
  }
  return palette;
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/^morphous-/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function themeDisplayName(system: MorphousSystem): string {
  const raw = system.name || system.motifName || titleFromSlug(system.slug);
  return raw.toLowerCase().startsWith("morphous ") ? raw : `Morphous ${raw}`;
}

function themeFileName(system: MorphousSystem, suffix: string): string {
  return `${system.slug}-${suffix}.json`;
}

export function getVSCodeTheme(system: MorphousSystem, mode: ThemeMode, boosted = false) {
  const isDark = mode === "dark";
  const palette = resolveThemePalette(system);

  let bg = isDark ? palette.depth : palette.background;
  const fg = isDark ? palette.background : palette.ink;
  let sidebarBg = isDark ? palette.ink : palette.surface;
  let surface = isDark ? palette.ink : palette.surface;

  let primary = palette.primary;
  let secondary = palette.secondary;
  let accent = palette.accent;
  let signal = palette.signal;

  if (boosted) {
    const bgHsl = hexToHsl(bg);
    const sbHsl = hexToHsl(sidebarBg);
    const surfHsl = hexToHsl(surface);

    if (isDark) {
      bg = hslToHex(bgHsl.h, bgHsl.s, Math.max(2, bgHsl.l - 4));
      sidebarBg = hslToHex(sbHsl.h, sbHsl.s, Math.max(4, sbHsl.l - 4));
      surface = hslToHex(surfHsl.h, surfHsl.s, Math.max(4, surfHsl.l - 4));
    } else {
      bg = hslToHex(bgHsl.h, bgHsl.s, Math.min(99, bgHsl.l + 3));
      sidebarBg = hslToHex(sbHsl.h, sbHsl.s, Math.min(97, sbHsl.l + 3));
      surface = hslToHex(surfHsl.h, surfHsl.s, Math.min(97, surfHsl.l + 3));
    }

    const primHsl = hexToHsl(primary);
    const secHsl = hexToHsl(secondary);
    const accHsl = hexToHsl(accent);
    const sigHsl = hexToHsl(signal);

    const targetS = isDark ? 75 : 60;
    const lSec = isDark ? 70 : 32;
    const lPrim = isDark ? 66 : 36;
    const lAcc = isDark ? 62 : 40;
    const lSig = isDark ? 73 : 28;

    primary = hslToHex(primHsl.h, targetS, lPrim);
    secondary = hslToHex(secHsl.h, targetS, lSec);
    accent = hslToHex(accHsl.h, targetS, lAcc);
    signal = hslToHex(sigHsl.h, targetS + 5, lSig);
  }

  const muted = palette.muted;
  const lineHighlight = isDark ? `${surface}40` : `${surface}50`;
  const selection = isDark ? `${secondary}35` : `${secondary}25`;
  const border = isDark ? "#ffffff15" : "#00000015";
  const displayName = `${themeDisplayName(system)}${boosted ? " - Boosted" : ""}`;

  return {
    name: `${displayName} (${isDark ? "Dark" : "Light"})`,
    type: mode,
    colors: {
      "focusBorder": primary,
      "foreground": fg,
      "widget.border": border,
      "selection.background": selection,

      "editor.background": bg,
      "editor.foreground": fg,
      "editor.lineHighlightBackground": lineHighlight,
      "editor.lineHighlightBorder": "#00000000",
      "editorCursor.foreground": primary,
      "editor.selectionBackground": selection,
      "editor.inactiveSelectionBackground": `${selection}80`,
      "editorLineNumber.foreground": `${muted}80`,
      "editorLineNumber.activeForeground": primary,

      "sideBar.background": sidebarBg,
      "sideBar.foreground": fg,
      "sideBar.border": border,
      "sideBarSectionHeader.background": isDark ? `${bg}80` : `${surface}80`,
      "sideBarSectionHeader.foreground": fg,
      "sideBarTitle.foreground": primary,

      "activityBar.background": bg,
      "activityBar.foreground": primary,
      "activityBar.inactiveForeground": `${fg}60`,
      "activityBar.border": border,
      "activityBarBadge.background": primary,
      "activityBarBadge.foreground": bg,

      "statusBar.background": bg,
      "statusBar.foreground": fg,
      "statusBar.border": border,
      "statusBar.noFolderBackground": bg,

      "titleBar.activeBackground": bg,
      "titleBar.activeForeground": fg,
      "titleBar.inactiveBackground": bg,
      "titleBar.inactiveForeground": `${fg}60`,
      "titleBar.border": border,

      "editorGroupHeader.tabsBackground": isDark ? `${bg}dd` : `${surface}aa`,
      "tab.activeBackground": bg,
      "tab.activeForeground": fg,
      "tab.inactiveBackground": isDark ? `${surface}60` : `${bg}60`,
      "tab.inactiveForeground": `${fg}80`,
      "tab.border": border,
      "tab.activeBorderTop": primary,

      "list.activeSelectionBackground": `${primary}30`,
      "list.activeSelectionForeground": fg,
      "list.hoverBackground": `${surface}40`,
      "list.hoverForeground": fg,
      "list.inactiveSelectionBackground": `${primary}15`,
      "list.inactiveSelectionForeground": fg,
      "list.highlightForeground": primary,

      "terminal.background": bg,
      "terminal.foreground": fg,
      "terminal.ansiBlack": isDark ? bg : fg,
      "terminal.ansiRed": signal,
      "terminal.ansiGreen": primary,
      "terminal.ansiYellow": accent,
      "terminal.ansiBlue": secondary,
      "terminal.ansiMagenta": signal,
      "terminal.ansiCyan": accent,
      "terminal.ansiWhite": fg,

      "input.background": surface,
      "input.foreground": fg,
      "input.border": border,
      "input.placeholderForeground": `${fg}60`,
      "button.background": primary,
      "button.foreground": bg,
      "button.hoverBackground": `${primary}dd`
    },
    tokenColors: [
      {
        scope: ["comment", "punctuation.definition.comment"],
        settings: { foreground: muted, fontStyle: "italic" }
      },
      {
        scope: ["keyword", "keyword.control", "keyword.operator.new", "keyword.operator.expression", "keyword.operator.logical"],
        settings: { foreground: secondary, fontStyle: "bold" }
      },
      {
        scope: ["storage.type", "storage.modifier"],
        settings: { foreground: secondary, fontStyle: "italic" }
      },
      {
        scope: ["entity.name.function", "support.function", "keyword.other.special-method", "meta.function-call"],
        settings: { foreground: primary }
      },
      {
        scope: ["string", "punctuation.definition.string", "string.template", "meta.template.expression"],
        settings: { foreground: accent }
      },
      {
        scope: ["constant.numeric", "constant.language", "constant.character", "constant.other", "variable.other.constant"],
        settings: { foreground: signal }
      },
      {
        scope: ["variable", "variable.other.readwrite", "variable.other.object"],
        settings: { foreground: fg }
      },
      {
        scope: ["variable.other.property", "support.variable.property", "meta.object-literal.key", "meta.object.member"],
        settings: { foreground: fg }
      },
      {
        scope: ["variable.parameter", "meta.parameter"],
        settings: { foreground: `${fg}dd`, fontStyle: "italic" }
      },
      {
        scope: [
          "punctuation.separator",
          "punctuation.terminator",
          "punctuation.definition.parameters",
          "punctuation.definition.block",
          "punctuation.section",
          "meta.brace"
        ],
        settings: { foreground: `${fg}80` }
      },
      {
        scope: ["keyword.operator"],
        settings: { foreground: fg }
      },
      {
        scope: [
          "entity.name.type",
          "entity.name.class",
          "entity.name.namespace",
          "entity.name.scope-resolution",
          "support.type",
          "support.class",
          "support.other.namespace"
        ],
        settings: { foreground: accent, fontStyle: "bold" }
      },
      {
        scope: ["entity.other.inherited-class"],
        settings: { foreground: primary }
      },
      {
        scope: ["entity.name.tag", "punctuation.definition.tag"],
        settings: { foreground: secondary }
      },
      {
        scope: ["entity.other.attribute-name"],
        settings: { foreground: primary }
      },
      {
        scope: ["meta.diff", "meta.diff.header"],
        settings: { foreground: muted }
      },
      {
        scope: "markup.deleted",
        settings: { foreground: signal }
      },
      {
        scope: "markup.inserted",
        settings: { foreground: primary }
      },
      {
        scope: "markup.changed",
        settings: { foreground: accent }
      },
      {
        scope: ["markup.heading", "markup.heading.setext", "punctuation.definition.heading"],
        settings: { foreground: primary, fontStyle: "bold" }
      },
      {
        scope: "markup.bold",
        settings: { fontStyle: "bold" }
      },
      {
        scope: "markup.italic",
        settings: { fontStyle: "italic" }
      },
      {
        scope: ["markup.inline.raw", "markup.raw.block"],
        settings: { foreground: accent }
      },
      {
        scope: ["string.other.link.title", "string.other.link.description"],
        settings: { foreground: primary }
      },
      {
        scope: "markup.underline.link",
        settings: { foreground: muted, fontStyle: "underline" }
      },
      {
        scope: ["punctuation.definition.list"],
        settings: { foreground: secondary }
      },
      {
        scope: ["markup.quote", "punctuation.definition.quote"],
        settings: { foreground: muted, fontStyle: "italic" }
      }
    ]
  };
}

function readJson(file: string): any {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file: string, value: unknown): void {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}${os.EOL}`);
}

function copyIfExists(source: string, destination: string): void {
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, destination);
  }
}

export function generateExtension(): GenerateResult {
  const systems = loadMorphousSystems().sort((a, b) => a.slug.localeCompare(b.slug));
  const distDir = path.join(process.cwd(), "dist");
  const themesDir = path.join(distDir, "themes");
  const packageTemplatePath = path.join(process.cwd(), "package.template.json");

  if (!fs.existsSync(packageTemplatePath)) {
    throw new Error("Missing package.template.json");
  }

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(themesDir, { recursive: true });

  const contributions: ThemeContribution[] = [];

  for (const system of systems) {
    for (const variant of variants) {
      const fileName = themeFileName(system, variant.suffix);
      const displayName = `${themeDisplayName(system)}${variant.boosted ? " - Boosted" : ""}`;
      const theme = getVSCodeTheme(system, variant.mode, variant.boosted);
      writeJson(path.join(themesDir, fileName), theme);
      contributions.push({
        label: `${displayName} (${variant.labelMode})`,
        uiTheme: variant.uiTheme,
        path: `./themes/${fileName}`
      });
    }
  }

  const packageJson = readJson(packageTemplatePath);
  packageJson.contributes = {
    ...(packageJson.contributes ?? {}),
    themes: contributions
  };
  writeJson(path.join(distDir, "package.json"), packageJson);
  copyIfExists(path.join(process.cwd(), "README.md"), path.join(distDir, "README.md"));
  copyIfExists(path.join(process.cwd(), "NOTICE.md"), path.join(distDir, "NOTICE.md"));
  copyIfExists(path.join(process.cwd(), "LICENSE"), path.join(distDir, "LICENSE"));

  return { systems, contributions, distDir, themesDir };
}

async function main() {
  const repoPath = repoPathFromEnvOrSibling();
  const source = repoPath
    ? `${repoPath} (${process.env.MORPHOUS_REF || DEFAULT_REF})`
    : `${process.env.MORPHOUS_REPO_URL || DEFAULT_REPO_URL} (${process.env.MORPHOUS_REF || DEFAULT_REF})`;
  console.log(`Reading Morphos catalog from git: ${source}`);

  const result = generateExtension();
  console.log(`Generated ${result.contributions.length} VS Code themes from ${result.systems.length} Morphous systems.`);
  console.log(`Output: ${path.relative(process.cwd(), result.distDir)}`);
}

if (process.argv[1] && (process.argv[1].endsWith("generate.ts") || process.argv[1].endsWith("generate.js"))) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
