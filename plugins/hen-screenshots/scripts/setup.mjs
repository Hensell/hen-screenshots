#!/usr/bin/env node
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
try {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12))
    throw new Error("Install Node.js 22.12 or newer, then run setup again.");
  for (const file of [
    "dist/cli.mjs",
    "assets/fonts/Manrope.ttf",
    "assets/fonts/Fraunces-Semibold.ttf",
  ])
    await access(new URL(`../${file}`, import.meta.url)).catch(() => {
      throw new Error(
        "This package is incomplete. Download a built release ZIP, or run npm run plugin:build in the Hen source repository.",
      );
    });
  console.log(
    "Installing Hen's pinned rendering dependencies in the plugin folder. This step downloads npm packages and native libraries; it does not upload your images.",
  );
  const install = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["ci", "--omit=dev", "--no-fund", "--no-audit"],
    {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );
  if (install.error)
    throw new Error(
      `Could not start npm: ${install.error.message}. Install Node.js with npm and retry.`,
    );
  if (install.status !== 0)
    throw new Error(
      "Dependency installation failed. Check the npm error above, your internet connection, and the supported systems in README.md, then retry setup.",
    );
  const doctor = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("hen.mjs", import.meta.url)), "doctor"],
    { cwd: root, stdio: "inherit" },
  );
  if (doctor.error || doctor.status !== 0)
    throw new Error(
      "Dependencies were installed, but the renderer check failed. See the error above before creating screenshots.",
    );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
