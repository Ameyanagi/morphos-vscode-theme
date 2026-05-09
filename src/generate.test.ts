import * as fs from "fs";
import * as path from "path";
import * as assert from "assert";
import { hexToHsl, hslToHex } from "./generate";

function runTest() {
  console.log("🧪 Running generated theme verification tests...");

  // Validate color conversion functions
  console.log("🎨 Verifying color conversion algorithms...");
  assert.deepStrictEqual(hexToHsl("#FF0000"), { h: 0, s: 100, l: 50 }, "Red conversion to HSL failed.");
  assert.strictEqual(hslToHex(0, 100, 50), "#FF0000", "Red conversion back to HEX failed.");
  assert.deepStrictEqual(hexToHsl("#00FF00"), { h: 120, s: 100, l: 50 }, "Green conversion to HSL failed.");
  assert.strictEqual(hslToHex(120, 100, 50), "#00FF00", "Green conversion back to HEX failed.");
  console.log("🎨 Color conversion functions passed successfully!");

  const themesDir = path.join(process.cwd(), "themes");
  const packageJsonPath = path.join(process.cwd(), "package.json");

  // Verify package.json exists
  assert.ok(fs.existsSync(packageJsonPath), "package.json should exist.");
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  // Check if themes directory exists
  if (!fs.existsSync(themesDir)) {
    console.log("⚠️ themes/ directory does not exist yet. Run generation first to produce themes.");
    return;
  }

  const files = fs.readdirSync(themesDir);
  console.log(`📂 Found ${files.length} theme files in themes/`);

  // Verify generated themes are valid JSON and contain basic keys
  for (const file of files) {
    if (file.endsWith(".json")) {
      const filePath = path.join(themesDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      
      assert.ok(content.name, `${file} should have a 'name' field.`);
      assert.ok(content.colors, `${file} should have a 'colors' field.`);
      assert.ok(content.tokenColors, `${file} should have a 'tokenColors' field.`);
      assert.strictEqual(typeof content.colors["editor.background"], "string", `${file} background color should be a string.`);
    }
  }

  console.log("✅ All generated themes are valid and structured correctly!");
}

try {
  runTest();
} catch (err: any) {
  console.error("❌ Verification failed:", err.message);
  process.exit(1);
}
