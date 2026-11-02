// Copyright 2026 Kingsrook, LLC
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
/** @type {{version:string}} */
const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
assert(/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(manifest.version), "Invalid release version.");
if(process.env["GITHUB_REF_TYPE"] === "tag")
{
   assert.equal(process.env["GITHUB_REF_NAME"], `v${manifest.version}`, "Release tag must match package.json.");
}
mkdirSync(new URL("../dist/", import.meta.url), { recursive: true });
const name = `qqq-print-protocol-${manifest.version}.tar.gz`;
const files = ["README.md", "LICENSE", "NOTICE", "CHANGELOG.md", "CONTRIBUTING.md", "SECURITY.md", "package.json", "package-lock.json", "tsconfig.json", "eslint.config.mjs", "schemas", "fixtures", "tools", "docs/INTEGRATION.md", "docs/DEVICE-CONTROLS.md", "docs/QQQ-AUTHENTICATION.md", "docs/REALTIME.md", "docs/PRINTER-MEDIA.md"];
const result = spawnSync("tar", ["-czf", `dist/${name}`, ...files], { cwd: root, stdio: "inherit", shell: false });
if(result.error)
{
   throw result.error;
}
assert.equal(result.status, 0, "Archive creation failed.");
const digest = createHash("sha256").update(readFileSync(new URL(`../dist/${name}`, import.meta.url))).digest("hex");
writeFileSync(new URL("../dist/SHA256SUMS", import.meta.url), `${digest}  ${name}\n`);
console.log(`Created dist/${name} and dist/SHA256SUMS.`);
