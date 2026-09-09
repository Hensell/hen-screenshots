import { createRequire } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { messageCatalog } from "./core";

// Use the existing formatter parser only in tests: missing translated UI copy
// should fail CI rather than quietly becoming an English-only button.
const require = createRequire(import.meta.url);
type Ast = { type: string; [key: string]: unknown };
const parser = require("prettier/plugins/typescript").parsers.typescript as {
  parse(source: string): Ast;
};
function walk(node: Ast, visit: (node: Ast) => void) {
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value))
      value.forEach((child) => {
        if (child?.type) walk(child, visit);
      });
    else if (value && typeof value === "object" && "type" in value)
      walk(value as Ast, visit);
  }
}
function literalBranches(node: Ast | undefined): string[] {
  if (!node) return [];
  if (node.type === "Literal" && typeof node.value === "string")
    return [node.value];
  if (node.type === "ConditionalExpression")
    return [
      ...literalBranches(node.consequent as Ast),
      ...literalBranches(node.alternate as Ast),
    ];
  return [];
}
describe("translation coverage", () => {
  it("covers literal UI translation keys, including conditional button labels", () => {
    const missing: string[] = [];
    for (const dir of [
      "src/app",
      "src/editor",
      "src/rendering",
      "src/i18n",
      "src/assets",
    ]) {
      for (const file of readdirSync(dir).filter((file) =>
        file.endsWith(".tsx"),
      )) {
        const path = join(dir, file);
        walk(parser.parse(readFileSync(path, "utf8")), (node) => {
          if (
            node.type !== "CallExpression" ||
            (node.callee as Ast)?.name !== "t"
          )
            return;
          for (const source of literalBranches((node.arguments as Ast[])[0])) {
            if (source && !Object.hasOwn(messageCatalog, source))
              missing.push(`${path}: ${source}`);
          }
        });
      }
    }
    expect(missing).toEqual([]);
  });
  it("covers every explicitly translated landing text and accessible attribute", () => {
    const html = readFileSync("index.html", "utf8");
    const missing = [...html.matchAll(/data-i18n(?:-[\w-]+)?="([^"]+)"/g)]
      .map((match) =>
        match[1]
          .replaceAll("&amp;", "&")
          .replaceAll("&quot;", '"')
          .replaceAll("&#39;", "'"),
      )
      .filter((key) => !Object.hasOwn(messageCatalog, key));
    expect(missing).toEqual([]);
  });
});
