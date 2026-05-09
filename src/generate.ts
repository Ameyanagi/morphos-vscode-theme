import * as fs from "fs";
import * as path from "path";

interface PaletteItem {
  role: string;
  hex: string;
}

interface ThemeIdentity {
  slug: string;
  name: string;
  motifName: string;
}

interface MorphosTheme {
  identity: ThemeIdentity;
  palette: PaletteItem[];
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex.split("").map(c => c + c).join("");
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
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
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
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    r = hue2rgb(h + 1/3);
    g = hue2rgb(h);
    b = hue2rgb(h - 1/3);
  }

  const toHex = (x: number) => {
    const val = Math.round(x * 255).toString(16);
    return val.length === 1 ? "0" + val : val;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Morphous-VSCode-Generator"
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  }
  return res.json();
}

export function getVSCodeTheme(morphous: MorphosTheme, mode: "dark" | "light", boosted = false) {
  const isDark = mode === "dark";
  const paletteMap = new Map(morphous.palette.map(p => [p.role, p.hex]));
  
  const getHex = (role: string, fallback: string) => paletteMap.get(role) || fallback;

  // Extract Morphos Core Palette Roles
  let bg = isDark ? getHex("Depth", "#071126") : getHex("Background", "#f4fbfb");
  const fg = isDark ? getHex("Background", "#f4fbfb") : getHex("Ink", "#101b3d");
  let sidebarBg = isDark ? getHex("Ink", "#101b3d") : getHex("Surface", "#dfeff3");
  let surface = isDark ? getHex("Ink", "#101b3d") : getHex("Surface", "#dfeff3");
  
  let primary = getHex("Primary", "#4ee28a");
  let secondary = getHex("Secondary", "#7c5cff");
  let accent = getHex("Accent", "#86e7ef");
  let signal = getHex("Signal", "#c06bdc");

  if (boosted) {
    // 1. Boost Background in opposite direction for maximum contrast while retaining foreground hue identity
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

    // 2. Map foreground with slightly softened target lightness to protect saturation & richness
    const primHsl = hexToHsl(primary);
    const secHsl = hexToHsl(secondary);
    const accHsl = hexToHsl(accent);
    const sigHsl = hexToHsl(signal);

    const targetS = isDark ? 75 : 60;

    // Stepped lightness for high scannability hierarchy (softened to account for shifted background contrast):
    // Dark Mode: Secondary (70%), Primary (66%), Accent (62%), Signal (73%)
    // Light Mode: Secondary (32%), Primary (36%), Accent (40%), Signal (28%)
    const lSec = isDark ? 70 : 32;
    const lPrim = isDark ? 66 : 36;
    const lAcc = isDark ? 62 : 40;
    const lSig = isDark ? 73 : 28;

    primary = hslToHex(primHsl.h, targetS, lPrim);
    secondary = hslToHex(secHsl.h, targetS, lSec);
    accent = hslToHex(accHsl.h, targetS, lAcc);
    signal = hslToHex(sigHsl.h, targetS + 5, lSig);
  }
  const muted = getHex("Muted", "#9baec0");

  // Softened variations for UI stability
  const lineHighlight = isDark ? `${surface}40` : `${surface}50`;
  const selection = isDark ? `${secondary}35` : `${secondary}25`;
  const border = isDark ? "#ffffff15" : "#00000015";

  return {
    name: `Morphous ${morphous.identity.motifName} (${isDark ? "Dark" : "Light"})`,
    type: mode,
    colors: {
      // Focus & Base Colors
      "focusBorder": primary,
      "foreground": fg,
      "widget.border": border,
      "selection.background": selection,

      // Editor UI
      "editor.background": bg,
      "editor.foreground": fg,
      "editor.lineHighlightBackground": lineHighlight,
      "editor.lineHighlightBorder": "#00000000",
      "editorCursor.foreground": primary,
      "editor.selectionBackground": selection,
      "editor.inactiveSelectionBackground": `${selection}80`,
      "editorLineNumber.foreground": `${muted}80`,
      "editorLineNumber.activeForeground": primary,

      // Sidebar
      "sideBar.background": sidebarBg,
      "sideBar.foreground": fg,
      "sideBar.border": border,
      "sideBarSectionHeader.background": isDark ? `${bg}80` : `${surface}80`,
      "sideBarSectionHeader.foreground": fg,
      "sideBarTitle.foreground": primary,

      // Activity Bar
      "activityBar.background": bg,
      "activityBar.foreground": primary,
      "activityBar.inactiveForeground": `${fg}60`,
      "activityBar.border": border,
      "activityBarBadge.background": primary,
      "activityBarBadge.foreground": bg,

      // Status Bar
      "statusBar.background": bg,
      "statusBar.foreground": fg,
      "statusBar.border": border,
      "statusBar.noFolderBackground": bg,

      // Title Bar
      "titleBar.activeBackground": bg,
      "titleBar.activeForeground": fg,
      "titleBar.inactiveBackground": bg,
      "titleBar.inactiveForeground": `${fg}60`,
      "titleBar.border": border,

      // Tabs & Editor Groups
      "editorGroupHeader.tabsBackground": isDark ? `${bg}dd` : `${surface}aa`,
      "tab.activeBackground": bg,
      "tab.activeForeground": fg,
      "tab.inactiveBackground": isDark ? `${surface}60` : `${bg}60`,
      "tab.inactiveForeground": `${fg}80`,
      "tab.border": border,
      "tab.activeBorderTop": primary,

      // List & Trees (File Explorer, etc)
      "list.activeSelectionBackground": `${primary}30`,
      "list.activeSelectionForeground": fg,
      "list.hoverBackground": `${surface}40`,
      "list.hoverForeground": fg,
      "list.inactiveSelectionBackground": `${primary}15`,
      "list.inactiveSelectionForeground": fg,
      "list.highlightForeground": primary,

      // Terminal
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

      // Inputs & Buttons
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
        settings: {
          foreground: muted,
          fontStyle: "italic"
        }
      },
      {
        scope: [
          "keyword",
          "keyword.control",
          "keyword.operator.new",
          "keyword.operator.expression",
          "keyword.operator.logical"
        ],
        settings: {
          foreground: secondary,
          fontStyle: "bold"
        }
      },
      {
        scope: [
          "storage.type",
          "storage.modifier"
        ],
        settings: {
          foreground: secondary,
          fontStyle: "italic"
        }
      },
      {
        scope: [
          "entity.name.function",
          "support.function",
          "keyword.other.special-method",
          "meta.function-call"
        ],
        settings: {
          foreground: primary
        }
      },
      {
        scope: [
          "string",
          "punctuation.definition.string",
          "string.template",
          "meta.template.expression"
        ],
        settings: {
          foreground: accent
        }
      },
      {
        scope: [
          "constant.numeric",
          "constant.language",
          "constant.character",
          "constant.other",
          "variable.other.constant"
        ],
        settings: {
          foreground: signal
        }
      },
      {
        scope: [
          "variable",
          "variable.other.readwrite",
          "variable.other.object"
        ],
        settings: {
          foreground: fg
        }
      },
      {
        scope: [
          "variable.other.property",
          "support.variable.property",
          "meta.object-literal.key",
          "meta.object.member"
        ],
        settings: {
          foreground: fg
        }
      },
      {
        scope: [
          "variable.parameter",
          "meta.parameter"
        ],
        settings: {
          foreground: `${fg}dd`,
          fontStyle: "italic"
        }
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
        settings: {
          foreground: `${fg}80`
        }
      },
      {
        scope: [
          "keyword.operator"
        ],
        settings: {
          foreground: fg
        }
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
        settings: {
          foreground: accent,
          fontStyle: "bold"
        }
      },
      {
        scope: [
          "entity.other.inherited-class"
        ],
        settings: {
          foreground: primary
        }
      },
      {
        scope: [
          "entity.name.tag",
          "punctuation.definition.tag"
        ],
        settings: {
          foreground: secondary
        }
      },
      {
        scope: [
          "entity.other.attribute-name"
        ],
        settings: {
          foreground: primary
        }
      },
      {
        scope: [
          "meta.diff",
          "meta.diff.header"
        ],
        settings: {
          foreground: muted
        }
      },
      {
        scope: "markup.deleted",
        settings: {
          foreground: signal
        }
      },
      {
        scope: "markup.inserted",
        settings: {
          foreground: primary
        }
      },
      {
        scope: "markup.changed",
        settings: {
          foreground: accent
        }
      },
      {
        scope: [
          "markup.heading",
          "markup.heading.setext",
          "punctuation.definition.heading"
        ],
        settings: {
          foreground: primary,
          fontStyle: "bold"
        }
      },
      {
        scope: "markup.bold",
        settings: {
          fontStyle: "bold"
        }
      },
      {
        scope: "markup.italic",
        settings: {
          fontStyle: "italic"
        }
      },
      {
        scope: [
          "markup.inline.raw",
          "markup.raw.block"
        ],
        settings: {
          foreground: accent
        }
      },
      {
        scope: [
          "string.other.link.title",
          "string.other.link.description"
        ],
        settings: {
          foreground: primary
        }
      },
      {
        scope: "markup.underline.link",
        settings: {
          foreground: muted,
          fontStyle: "underline"
        }
      },
      {
        scope: [
          "punctuation.definition.list"
        ],
        settings: {
          foreground: secondary
        }
      },
      {
        scope: [
          "markup.quote",
          "punctuation.definition.quote"
        ],
        settings: {
          foreground: muted,
          fontStyle: "italic"
        }
      }
    ]
  };
}

async function main() {
  console.log("🌊 Fetching Morphos repository tree...");
  
  // Fetch the entire file tree of Ameyanagi/morphos recursively in 1 single call to avoid rate limits!
  const treeData = await fetchJson(
    "https://api.github.com/repos/Ameyanagi/morphos/git/trees/main?recursive=1"
  );
  
  const files: { path: string }[] = treeData.tree || [];
  
  // Filter for theme.json files to discover all valid slugs
  const themeFiles = files.filter(
    (f) => f.path.startsWith("public/systems/") && f.path.endsWith("/theme.json")
  );
  
  const slugs = themeFiles.map((f) => {
    const parts = f.path.split("/");
    return parts[2]; // the slug folder name
  });
  
  console.log(`💎 Found ${slugs.length} Morphos themes! Preparing to generate VSCode themes...`);
  
  const themesDir = path.join(process.cwd(), "themes");
  if (!fs.existsSync(themesDir)) {
    fs.mkdirSync(themesDir, { recursive: true });
  }

  const contributedThemes: any[] = [];
  
  // To avoid hitting GitHub limits or network issues, fetch them sequentially with a tiny delay
  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const percentage = Math.round(((i + 1) / slugs.length) * 100);
    console.log(`[${percentage}%] Processing ${slug} (${i + 1}/${slugs.length})...`);
    
    try {
      const themeUrl = `https://raw.githubusercontent.com/Ameyanagi/morphos/main/public/systems/${slug}/theme.json`;
      const morphousData: MorphosTheme = await fetchJson(themeUrl);
      
      const motifName = morphousData.identity.motifName;
      const cleanSlug = slug.replace("morphous-", "");
      
      const darkThemePath = path.join(themesDir, `morphous-${cleanSlug}-dark.json`);
      const darkBoostedPath = path.join(themesDir, `morphous-${cleanSlug}-boosted-dark.json`);
      const lightThemePath = path.join(themesDir, `morphous-${cleanSlug}-light.json`);
      const lightBoostedPath = path.join(themesDir, `morphous-${cleanSlug}-boosted-light.json`);
      
      const darkTheme = getVSCodeTheme(morphousData, "dark", false);
      const darkThemeBoosted = getVSCodeTheme(morphousData, "dark", true);
      const lightTheme = getVSCodeTheme(morphousData, "light", false);
      const lightThemeBoosted = getVSCodeTheme(morphousData, "light", true);
      
      fs.writeFileSync(darkThemePath, JSON.stringify(darkTheme, null, 2));
      fs.writeFileSync(darkBoostedPath, JSON.stringify(darkThemeBoosted, null, 2));
      fs.writeFileSync(lightThemePath, JSON.stringify(lightTheme, null, 2));
      fs.writeFileSync(lightBoostedPath, JSON.stringify(lightThemeBoosted, null, 2));
      
      contributedThemes.push(
        {
          label: `Morphous ${motifName} (Dark)`,
          uiTheme: "vs-dark",
          path: `./themes/morphous-${cleanSlug}-dark.json`
        },
        {
          label: `Morphous ${motifName} - Boosted (Dark)`,
          uiTheme: "vs-dark",
          path: `./themes/morphous-${cleanSlug}-boosted-dark.json`
        },
        {
          label: `Morphous ${motifName} (Light)`,
          uiTheme: "vs-light",
          path: `./themes/morphous-${cleanSlug}-light.json`
        },
        {
          label: `Morphous ${motifName} - Boosted (Light)`,
          uiTheme: "vs-light",
          path: `./themes/morphous-${cleanSlug}-boosted-light.json`
        }
      );
    } catch (err: any) {
      console.error(`❌ Failed to process theme ${slug}:`, err.message);
    }
    
    // Tiny delay to be gentle on servers
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  
  // Update package.json contributors array
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  
  packageJson.contributes.themes = contributedThemes;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  console.log(`✨ Successfully generated ${contributedThemes.length} VSCode themes and updated package.json!`);
}

if (process.argv[1] && process.argv[1].endsWith("generate.ts")) {
  main().catch((err) => {
    console.error("🚨 Critical Error during generation:", err);
    process.exit(1);
  });
}
