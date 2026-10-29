# Contributing

Use Node.js 24 or newer. Install the locked development dependencies with `npm ci`, then run `npm run check`. The runtime protocol has no JavaScript dependency; Ajv and ajv-formats are development-only JSON Schema validators.

Make changes through a pull request. Describe the client/server behavior affected and update README, schema, fixtures and changelog together. Keep credentials, customer documents, printer addresses and machine-specific data out of fixtures. Samples must remain synthetic.

Run both the Java and .NET consumers' protocol tests for a contract change. Check out sibling `qbit-printing`, `qqq-print-agent` and this repository; see [integration notes](docs/INTEGRATION.md). Coordinate consumer changes before merging a breaking change.

Keep wire names stable within `/printing/v1`. Optional response fields may be added; clients ignore unknown response fields. Removing/renaming a field, changing its type or changing an existing field's meaning requires a new protocol version. A prerelease package version is not permission to silently break an already deployed connector.

`npm run bundle` produces the release archive and checksum in `dist/`. Do not hand-edit generated checksums. Release tags must match the version in package.json, prefixed with `v`. Commits and releases are made by maintainers after review.
