import { test } from "node:test"
import assert from "node:assert"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

test("sample test - project config is valid", () => {
  const pkg = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf8"))
  assert.strictEqual(typeof pkg.name, "string", "package has a name")
  assert.strictEqual(typeof pkg.version, "string", "package has a version")
})

test("sample test - basic assertion", () => {
  assert.strictEqual(1 + 1, 2, "math works")
})
