// Gobble Dash — hand-in program for make.fun (Node 22, standard library only).
//
// Copies game/ and screenshots/ into the output directory and writes
// dossier.json with buildDossier from vendor/makefun-game.ts.
// The output directory comes from MAKEFUN_OUTPUT_DIR, defaulting to /output.
// It never deletes the output directory: the grading environment may mount
// /output, so we only create it. All source paths are anchored to this
// script's location, so grading works from any working directory.

import { buildDossier } from "./vendor/makefun-game.ts";
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL(".", import.meta.url).pathname;

if (!existsSync(join(repoRoot, "game")) || !existsSync(join(repoRoot, "game", "index.html"))) {
  throw new Error("game/index.html not found.");
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

// Create the output directory (and parents) if it is not there yet.
mkdirSync(outDir, { recursive: true });

// Copy the game itself.
cpSync(join(repoRoot, "game"), join(outDir, "game"), { recursive: true });

// Copy the screenshots when they exist.
const shotsDir = join(repoRoot, "screenshots");
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, "screenshots"), { recursive: true });
}

// Build the dossier with the competition's limits.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots_max: 4,
  screenshot_max_bytes: 262144,
  game_max_entries: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, "dossier.json"), dossier);

console.log("Wrote dossier.json to " + outDir + " (" + dossier.length + " bytes)");
