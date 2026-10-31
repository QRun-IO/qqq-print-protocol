# Consumer integration

The coordinated repositories are:

- [qbit-printing](https://github.com/QRun-IO/qbit-printing): QQQ 4.1+ server metadata, durable queue and HTTP endpoints.
- [qqq-print-agent](https://github.com/QRun-IO/qqq-print-agent): Windows AppKit companion, service and printer adapters.
- [qqq-print-protocol](https://github.com/QRun-IO/qqq-print-protocol): this specification and compatibility fixtures.

For local development, clone them as siblings. The Java HTTP test defaults to `../qqq-print-protocol/fixtures` and accepts `-Dprinting.protocol.fixtures=<directory>`. The Windows tests link shared fixtures from the sibling repository. See each consumer README for its build and platform requirements.

CI must check out this repository at an immutable commit reviewed with the consumer change. A checkout path of `qqq-print-protocol` beside `qbit-printing` or `qqq-print-agent` preserves the local layout. Do not pin a moving branch for release qualification. Maintainers update the pinned commit when adopting a new compatible contract release.

If a consumer builds outside a multi-checkout workspace, download the release archive, verify `SHA256SUMS`, extract it and point its tests at `fixtures/`. Consume `schemas/protocol.schema.json#/$defs/<Type>` with a JSON Schema 2020-12 validator.

## Versioning

The coordinated realtime client requires printing semantic extension
`>=1.1.0 <2.0.0` and the authenticated `qqq-printing.v1` WebSocket subprotocol.
Wire payload version remains 1. [REALTIME.md](REALTIME.md) defines the new frames,
configurable policy, streaming limits and runtime acceptance expectations.
The source package is `0.3.0-rc.1`, unreleased. Its fixtures do not establish a
published package or installed behavior.

Historical HTTP wire protocol v1 is selected by the `/printing/v1` path and enrollment response `protocolVersion: 1`. Published distribution version `0.2.0-rc.1` identifies the specification/fixture bundle; it does not change that wire version. The Windows and QBit release numbers are independent of both. Native clients use the discovered printing extension semantic version; the realtime contract above adds its explicit version/capability gate without redefining core discovery.

Additive optional response fields can remain v1. Required new inputs on existing routes, renamed fields, removed enum values or changed semantics require explicit compatibility design and usually a new path version. Consumers must not assume unadvertised capabilities.

The published `0.2.0-rc.1` extension adds explicit `device-control-v1` discovery and
new control routes without adding required fields to existing requests. See the
[device-control contract](DEVICE-CONTROLS.md) for state, commands, receipts,
timestamped idempotency, and legacy behavior. Source fixtures do not establish
consumer implementation or installation. Pin the reviewed protocol
commit with matching server and Windows compatibility tests before shipping.

Claim acknowledgment means local receipt; SPOOLED means Windows accepted the document. Neither proves physical output. Cross-language compatibility tests should assert these distinctions as well as spelling, JSON casing, formats, option defaults and content integrity.

## Checks and artifacts

```sh
npm ci
npm run check
npm run bundle
```

The check runs full draft-2020-12 schema compilation and fixture validation with Ajv, plus independent content/hash/base64 and invalid-input checks. `node tools/verify-fixtures.mjs` remains available without installing dependencies for a quick subset check.

The bundle includes specification, schema, fixtures, tools, locked validator dependencies and license metadata, excluding installed dependencies. Consumers do not need Node.js to use the schema or fixture JSON. Maintainers publish the bundle as a GitHub release asset; no npm registry publication is performed.
