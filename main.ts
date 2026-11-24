// Entry program for the make.fun bounty
// "Promote make.fun's make-your-own-bounty post on X"
// (post-x-promote-make-your-own-bounty-01).
//
// The entry itself is a post on X: james's @dik_prmn quote post of
// @makefunai's make-your-own-bounty announcement. This repository hands
// that post in through POST.json at the root, which holds exactly
// {"url": "https://x.com/<handle>/status/<id>"}.
//
// All this program has to do is copy POST.json from the repository root
// to /output/POST.json, where the house's sealed scorer reads it. Before
// copying, it validates the file: it must parse as a JSON object and its
// url must be an X post address of the shape
// https://x.com/<handle>/status/<digits>. Any problem is fatal: the
// program prints a clear message to stderr and exits non-zero rather
// than handing in a broken entry.

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(repoRoot, "POST.json");
const outputDir = "/output";
const outputPath = join(outputDir, "POST.json");

const POST_URL_PATTERN = /^https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/\d+$/;

function fail(message: string): never {
  console.error(`main.ts: error: ${message}`);
  process.exit(1);
}

// Read the post file. A missing or unreadable POST.json is fatal.
let raw: string;
try {
  raw = readFileSync(sourcePath, "utf8");
} catch (err) {
  fail(`cannot read ${sourcePath}: ${(err as Error).message}`);
}

// Parse it: POST.json must be a JSON object, not an array or a scalar.
let parsed: unknown;
try {
  parsed = JSON.parse(raw!);
} catch (err) {
  fail(`POST.json is not valid JSON: ${(err as Error).message}`);
}
if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
  fail("POST.json must be a JSON object like {\"url\": \"https://x.com/<handle>/status/<id>\"}");
}

// Its url must be an X post address with a digits-only post id.
const url = (parsed as { url?: unknown }).url;
if (typeof url !== "string" || !POST_URL_PATTERN.test(url)) {
  fail(`POST.json url is not an X post address (https://x.com/<handle>/status/<id>): ${JSON.stringify(url)}`);
}

// Copy POST.json to /output, creating the directory if needed.
try {
  mkdirSync(outputDir, { recursive: true });
  copyFileSync(sourcePath, outputPath);
} catch (err) {
  fail(`cannot copy POST.json to ${outputPath}: ${(err as Error).message}`);
}

console.log(`main.ts: copied POST.json to ${outputPath} (url: ${url})`);
