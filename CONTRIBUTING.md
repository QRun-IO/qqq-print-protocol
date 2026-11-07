# Contributing

Use Node.js 24 or newer. Install the locked development dependencies with `npm ci`, then run `npm run check` (`npm test` is the standard entry point for the same check). The runtime protocol has no JavaScript dependency; Ajv and ajv-formats are development-only JSON Schema validators.

Make changes through a pull request to `main` on the [primary Gitea repository](https://git.kof22.com/QRun-IO/qqq-print-protocol). GitHub is a readable shadow; do not open ordinary development PRs or publish releases there. Describe the client/server behavior affected and update README, schema, fixtures and changelog together. Keep credentials, customer documents, printer addresses and machine-specific data out of fixtures. Samples must remain synthetic.

Run both the Java and .NET consumers' protocol tests for a contract change. Check out sibling `qbit-printing`, `qqq-print-agent` and this repository; see [integration notes](docs/INTEGRATION.md). Coordinate consumer changes before merging a breaking change.

Keep wire-v1 payload names stable for native `/qqq/v1/qbit/printing` and explicit legacy `/printing/v1` routes. Optional response fields may be added; clients ignore unknown response fields. Removing/renaming a field, changing its type or changing an existing field's meaning requires explicit versioned compatibility design. Package, printing extension, wire and WebSocket subprotocol versions are independent; see [the version registry](docs/VERSIONS.md). A package version is not permission to silently break an already deployed connector.

`npm run bundle` produces the release archive and checksum in `dist/`. Do not hand-edit generated checksums. Release tags must match the version in package.json, prefixed with `v`. Maintainers publish reviewed artifacts on [Gitea releases](https://git.kof22.com/QRun-IO/qqq-print-protocol/releases). GitHub Actions for this repository were retired on 2026-11-04; retained `.github/scripts` remain local/shared-CI tooling. See [current release provenance](docs/INTEGRATION.md#stable-printing-release) before updating consumer fixture pins.

## Script quality

Owned scripts follow the KofTwentyTwo standard at revision `fbfc8d2cf3b5e16ae9750b04cf9de1794f1e7152` (configs adapted from its `python` and `typescript` profiles): three-space indentation, Ruff 0.17.3 format/lint (locked in `uv.lock`) and strict Pyright 1.1.414 (Microsoft's npm package, locked in `package-lock.json` and run through Node) for `.github/scripts/*.py`, and ESLint 10 with Stylistic (Allman) plus strict `tsc` over JSDoc for `tools/**/*.mjs` and `eslint.config.mjs`. Restore with `uv sync --locked` and `npm ci --ignore-scripts`, then run:

```text
uv run --locked --no-sync python .github/scripts/test-script-quality.py
uv run --locked --no-sync python .github/scripts/check-script-quality.py
npm run typecheck
npm run lint
```

`npm run quality` runs the repository's Python sequence in one step (`uv sync --locked`, both script-quality commands and both source-header commands); Gitea CI (`.gitea/workflows/build.yaml`, the shared ci-workflows `node.yaml`) runs the same commands individually, then typecheck, lint, check and bundle. It needs `uv` on `PATH` and `npm ci` first.

`check-script-quality.py` fails for any tracked Python outside `.github/scripts/` or JavaScript outside the `tsconfig.json` include list, and requires Pyright's analyzed-file count to equal the selected scripts. Pyright must run as `pyright -p .github`: it silently skips dot directories from a root config. Documented exceptions: CLI `print`/`console.log` only in `check-*.py` and `tools/`; synthetic test assertions and boundary constants; narrow inline `noqa` comments for fixed no-shell Git/interpreter calls and ordered fail-closed validators. Do not loosen a rule or add a type waiver to pass. `package.json` overrides `minimatch` to 11.0.1, the patched release for [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) (affected before 11.0.1); keep it until ESLint's own dependency range includes a patched release. The only npm license exception, [EX-0015](https://github.com/KofTwentyTwo/standards/blob/main/exceptions/register.md#ex-0015) for development-only `uri-js` 4.4.1, is enforced by `check-script-quality.py` (version, lock integrity and installed license bytes); changing that package needs renewed approval.
