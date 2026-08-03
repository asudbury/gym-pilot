#!/usr/bin/env node

const { execFileSync, spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    ...options,
  });
}

const repoRoot = run("git", ["rev-parse", "--show-toplevel"]).trim();
const stagedFiles = run(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
  {
    cwd: repoRoot,
  },
)
  .split(/\r?\n/)
  .map((value) => value.trim())
  .filter(Boolean);

const prettierExtensions =
  /\.(cjs|mjs|js|jsx|ts|tsx|css|scss|less|json|md|mdx|html|vue|yaml|yml)$/i;
const filesToCheck = stagedFiles
  .map((file) => file.replace(/\\/g, "/"))
  .filter((file) => {
    const normalizedFile = file.replace(/^\.\//, "");
    const fullPath = path.join(repoRoot, normalizedFile);
    return prettierExtensions.test(normalizedFile) && existsSync(fullPath);
  });

if (filesToCheck.length === 0) {
  console.log("No staged files require Prettier checks.");
  process.exit(0);
}

const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(
  process.execPath,
  [
    "-e",
    `require('child_process').spawnSync('${npmExecutable}', ['--workspace','apps/web','exec','--','prettier','--check',${filesToCheck.map((file) => `'${file.replace(/'/g, "\\'")}'`).join(",")}], {stdio:'inherit', cwd: process.cwd()})`,
  ],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if (result.error) {
  console.error("\nPrettier check failed to start.");
  console.error(result.error.message);
  process.exit(1);
}

if (result.status === 0) {
  console.log(`Prettier checked ${filesToCheck.length} changed file(s).`);
  process.exit(0);
}

console.error("\nPrettier check failed for staged files.");
console.error(`Run: npx prettier --write ${filesToCheck.join(" ")}`);
process.exit(result.status ?? 1);
