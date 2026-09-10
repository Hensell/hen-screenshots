#!/usr/bin/env node
try {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12))
    throw new Error("Hen Screenshots requires Node.js 22.12 or newer.");
  const { main } = await import("../dist/cli.mjs");
  await main();
} catch (error) {
  const missing = error?.code === "ERR_MODULE_NOT_FOUND";
  const message = missing
    ? "Hen's local runtime is not ready. In the plugin folder, run npm ci --omit=dev once. If dist/cli.mjs is missing, use a built plugin ZIP or run npm run plugin:build in the Hen repository."
    : error instanceof Error
      ? error.message
      : String(error);
  process.stderr.write(JSON.stringify({ ok: false, error: message }) + "\n");
  process.exitCode = 1;
}
