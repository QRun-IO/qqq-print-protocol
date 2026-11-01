# Contributing

Use Node.js 24 or newer. Install the locked development dependencies with `npm ci`, then run `npm run check`. The runtime protocol has no JavaScript dependency; Ajv and ajv-formats are development-only JSON Schema validators.

Make changes through a pull request. Describe the client/server behavior affected and update README, schema, fixtures and changelog together. Keep credentials, customer documents, printer addresses and machine-specific data out of fixtures. Samples must remain synthetic.

Run both the Java and .NET consumers' protocol tests for a contract change. Check out sibling `qbit-printing`, `qqq-print-agent` and this repository; see [integration notes](docs/INTEGRATION.md). Coordinate consumer changes before merging a breaking change.

Keep wire names stable within `/printing/v1`. Optional response fields may be added; clients ignore unknown response fields. Removing/renaming a field, changing its type or changing an existing field's meaning requires a new protocol version. A prerelease package version is not permission to silently break an already deployed connector.

`npm run bundle` produces the release archive and checksum in `dist/`. Do not hand-edit generated checksums. Release tags must match the version in package.json, prefixed with `v`. Commits and releases are made by maintainers after review.

## Script quality

Owned scripts follow the KofTwentyTwo standard at revision `fbfc8d2cf3b5e16ae9750b04cf9de1794f1e7152` (configs adapted from its `python` and `typescript` profiles): three-space indentation, Ruff 0.17.3 format/lint (locked in `uv.lock`) and strict Pyright 1.1.414 (Microsoft's npm package, locked in `package-lock.json` and run through Node) for `.github/scripts/*.py`, and ESLint 10 with Stylistic (Allman) plus strict `tsc` over JSDoc for `tools/**/*.mjs` and `eslint.config.mjs`. Restore with `uv sync --locked` and `npm ci --ignore-scripts`, then run:

```text
uv run --locked --no-sync python .github/scripts/test-script-quality.py
uv run --locked --no-sync python .github/scripts/check-script-quality.py
npm run typecheck
npm run lint
```

`check-script-quality.py` fails for any tracked Python outside `.github/scripts/` or JavaScript outside the `tsconfig.json` include list, and requires Pyright's analyzed-file count to equal the selected scripts. Pyright must run as `pyright -p .github`: it silently skips dot directories from a root config. Documented exceptions: CLI `print`/`console.log` only in `check-*.py` and `tools/`; synthetic test assertions and boundary constants; narrow inline `noqa` comments for fixed no-shell Git/interpreter calls and ordered fail-closed validators. Do not loosen a rule or add a type waiver to pass. `package.json` overrides `minimatch` to 11.0.1, the patched release for [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) (affected before 11.0.1); keep it until ESLint's own dependency range includes a patched release.
