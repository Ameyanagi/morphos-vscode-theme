import * as fs from "fs";
import * as path from "path";
import * as assert from "assert";
import {
  generateExtension,
  getVSCodeTheme,
  hexToHsl,
  hslToHex,
  resolveThemePalette,
  themeDisplayName,
  type MorphousSystem,
} from "./generate";

const hexColorPattern = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

function assertUnique(values: string[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    assert.ok(!seen.has(value), `${label} must be unique: ${value}`);
    seen.add(value);
  }
}

function assertThemeFile(file: string) {
  const theme = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.ok(theme.name, `${file} should have a name`);
  assert.ok(theme.colors, `${file} should have colors`);
  assert.ok(Array.isArray(theme.tokenColors), `${file} should have tokenColors`);
  assert.ok(["dark", "light"].includes(theme.type), `${file} should have a valid type`);
  assert.strictEqual(
    typeof theme.colors["editor.background"],
    "string",
    `${file} should define editor.background`,
  );
  assert.ok(
    hexColorPattern.test(theme.colors["editor.background"]),
    `${file} editor.background should be a hex color`,
  );
}

function testColorConversion() {
  assert.deepStrictEqual(
    hexToHsl("#FF0000"),
    { h: 0, s: 100, l: 50 },
    "Red conversion to HSL failed",
  );
  assert.strictEqual(hslToHex(0, 100, 50), "#FF0000", "Red conversion back to HEX failed");
  assert.deepStrictEqual(
    hexToHsl("#00FF00"),
    { h: 120, s: 100, l: 50 },
    "Green conversion to HSL failed",
  );
  assert.strictEqual(hslToHex(120, 100, 50), "#00FF00", "Green conversion back to HEX failed");
}

function testRoleFallbacks() {
  const system: MorphousSystem = {
    slug: "morphous-test",
    name: "Test System",
    motifName: "Test Motif",
    palette: [
      { role: "Background", hex: "#FFFFFF" },
      { role: "Text", hex: "#111111" },
      { role: "Action", hex: "#2255AA" },
      { role: "Support", hex: "#33AA55" },
      { role: "Highlight", hex: "#AA33DD" },
      { role: "Warning", hex: "#DD5533" },
      { role: "Card", hex: "#EEEEEE" },
      { role: "Quiet", hex: "#888888" },
      { role: "Night", hex: "#05070A" },
    ],
  };

  const palette = resolveThemePalette(system);
  assert.strictEqual(palette.ink, "#111111");
  assert.strictEqual(palette.primary, "#2255AA");
  assert.strictEqual(palette.secondary, "#33AA55");
  assert.strictEqual(palette.accent, "#AA33DD");
  assert.strictEqual(palette.signal, "#DD5533");
  assert.strictEqual(palette.surface, "#EEEEEE");
  assert.strictEqual(palette.muted, "#888888");
  assert.strictEqual(palette.depth, "#05070A");
  assert.strictEqual(themeDisplayName(system), "Morphous Test System");

  const boostedTheme = getVSCodeTheme(system, "dark", true);
  assert.ok(boostedTheme.name.includes("Boosted"), "Boosted theme name should include Boosted");
}

function testGeneratedExtension() {
  const result = generateExtension();
  const packageJsonPath = path.join(result.distDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const expectedThemeCount = result.systems.length * 4;

  assert.strictEqual(
    result.contributions.length,
    expectedThemeCount,
    "Expected four variants per system",
  );
  assert.strictEqual(
    pkg.contributes.themes.length,
    expectedThemeCount,
    "Generated package contributes count mismatch",
  );
  assertUnique(
    pkg.contributes.themes.map((theme: { label: string }) => theme.label),
    "Theme labels",
  );
  assertUnique(
    pkg.contributes.themes.map((theme: { path: string }) => theme.path),
    "Theme paths",
  );

  const files = fs.readdirSync(result.themesDir).filter((file) => file.endsWith(".json"));
  assert.strictEqual(files.length, expectedThemeCount, "Generated theme file count mismatch");

  for (const contribution of pkg.contributes.themes) {
    const themeFile = path.join(result.distDir, contribution.path.replace(/^\.\//, ""));
    assert.ok(fs.existsSync(themeFile), `${contribution.path} should exist`);
  }

  for (const file of files) {
    assertThemeFile(path.join(result.themesDir, file));
  }
}

try {
  testColorConversion();
  testRoleFallbacks();
  testGeneratedExtension();
  console.log("Generated VS Code theme extension is valid.");
} catch (err: unknown) {
  console.error("Verification failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
