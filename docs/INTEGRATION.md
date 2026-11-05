# Consumer integration

## Stable printing release

The current primary release is [protocol 1.1.0](https://git.kof22.com/QRun-IO/qqq-print-protocol/releases/tag/v1.1.0) (annotated tag `v1.1.0` at source `5005f3c9e27053b6c327bb923695012832c0fdcc`, bundle `qqq-print-protocol-1.1.0.tar.gz` SHA-256 `541f0f3054cbfe9ce16e7dea58fad01b55a7f0e9246ade8f30df1bb826940703`), adding printing extension 2.4.0's `printer-approval-v1` capability and `PRINTERS` frame. It pairs with [QBit 1.1.0](https://git.kof22.com/QRun-IO/qbit-printing/releases/tag/v1.1.0) and the Windows connector 1.2.0 (pending publication at the time of writing); the 1.0.0 cohort below stays valid for 2.3 peers.

The primary [protocol 1.0.0 release](https://git.kof22.com/QRun-IO/qqq-print-protocol/releases/tag/v1.0.0)
is published on Gitea (release record 1344). This is the specification and fixture
bundle, not an application installer.

| Component | Stable cohort |
| --- | --- |
| Protocol distribution | [1.0.0](https://git.kof22.com/QRun-IO/qqq-print-protocol/releases/tag/v1.0.0) |
| Windows Print Agent | [1.0.1](https://git.kof22.com/QRun-IO/qqq-print-agent/releases/tag/v1.0.1) |
| Printing QBit | [1.0.0](https://git.kof22.com/QRun-IO/qbit-printing/releases/tag/v1.0.0) |
| QQQ dependency baseline | 4.1.0-RC.21; printing targets QQQ 4.1+ |
| Native printing semantic API | 2.3.0 |
| Wire payload / WebSocket subprotocol | 1 / `qqq-printing.v1` |

Upgrade the server before the matching Windows connector. The connector opens an
authenticated two-way WebSocket from the facility to QQQ. Job notifications,
controls and receipts use that channel; documents stream separately over
same-origin HTTPS. Reconnection is automatic and preserves durable job/receipt
identity. There is no job/control polling fallback. Standard QQQ authentication
and current-user permissions apply throughout.

### Source and fixtures

The annotated `v1.0.0` tag resolves to protocol source commit
`d652fba1317aec7f25c5a464bac15e97d6094e67`. The release changes distribution
versioning, not the wire schema.

The existing consumer fixture pin is
`42c0d249f81395f00408ec0f92638dcbbf5deb03`. This reviewed immutable fixture source
is distinct from the stable release source commit. Retain the pin until a reviewed
consumer change updates it; do not substitute a moving branch or imply the two
commits are identical. The readable GitHub shadow retains that immutable commit
for the Windows fixture bridge.

### Publication and verification scope

Use [Gitea](https://git.kof22.com/QRun-IO/qqq-print-protocol) for development, pull
requests, CI and releases. Protocol GitHub Actions were retired on 2026-11-04 at
01:11 UTC; the shadow remains readable. Historical workflow files, compatibility
decisions and test evidence are retained as history. Their presence is not an
active GitHub publishing path.

Download the release archive and `SHA256SUMS` from the primary release and verify
the archive before extracting it. No npm registry publication is performed.
This documentation closeout introduces no new build, hosted attestation or
hardware-acceptance claim. Schema fixtures establish message shape; installation,
authentication deployment and physical output evidence belong to the consumer
repositories. See [authentication](QQQ-AUTHENTICATION.md),
[realtime transport](REALTIME.md), and [media selection](PRINTER-MEDIA.md).

## Consumer checkout

The coordinated repositories are:

- [qbit-printing](https://git.kof22.com/QRun-IO/qbit-printing): QQQ 4.1+ server metadata, durable queue, native API and realtime WebSocket endpoint.
- [qqq-print-agent](https://git.kof22.com/QRun-IO/qqq-print-agent): Windows AppKit companion, service and printer adapters.
- [qqq-print-protocol](https://git.kof22.com/QRun-IO/qqq-print-protocol): this specification and compatibility fixtures.

The [stable cohort](INTEGRATION.md#stable-printing-release) is protocol 1.0.0, Windows 1.0.1 and QBit 1.0.0,
with native printing API 2.3.0 and QQQ 4.1.0-RC.21 as its dependency baseline.

For local development, clone them as siblings. The Java HTTP test defaults to `../qqq-print-protocol/fixtures` and accepts `-Dprinting.protocol.fixtures=<directory>`. The Windows tests link shared fixtures from the sibling repository. See each consumer README for its build and platform requirements.

CI must check out this repository at an immutable commit reviewed with the consumer change. A checkout path of `qqq-print-protocol` beside `qbit-printing` or `qqq-print-agent` preserves the local layout. Do not pin a moving branch for release qualification. The current consumer fixture pins are `ac835f8b9396b641b525669249fdb4a1e2a50c99` (Windows, the PR 11 commit) and `5005f3c9e27053b6c327bb923695012832c0fdcc` (QBit, the 1.1.0 source); both carry the 1.1.0 fixtures. Maintainers update the pin through a reviewed consumer change; the readable GitHub shadow retains it for the Windows fixture bridge.

If a consumer builds outside a multi-checkout workspace, download the release archive, verify `SHA256SUMS`, extract it and point its tests at `fixtures/`. Consume `schemas/protocol.schema.json#/$defs/<Type>` with a JSON Schema 2020-12 validator.

## Versioning

The coordinated realtime client requires printing semantic extension
`>=2.0.0 <3.0.0` and the authenticated `qqq-printing.v1` WebSocket subprotocol.
Wire payload version remains 1. [REALTIME.md](REALTIME.md) defines the new frames,
configurable policy, streaming limits and runtime acceptance expectations.
This transport is included in [stable protocol 1.0.0](INTEGRATION.md#stable-printing-release).
Upgrade the server before the Windows connector; fixtures do not establish installed behavior.

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
npm ci --ignore-scripts
npm run check
npm run bundle
```

The check runs full draft-2020-12 schema compilation and fixture validation with Ajv, plus independent content/hash/base64 and invalid-input checks. `node tools/verify-fixtures.mjs` remains available without installing dependencies for a quick subset check.

The bundle includes specification, schema, fixtures, tools, dependency manifests and lockfile, and license metadata, excluding installed dependencies. Consumers do not need Node.js to use the schema or fixture JSON. Maintainers publish the bundle and checksum on [Gitea releases](https://git.kof22.com/QRun-IO/qqq-print-protocol/releases); no npm registry publication is performed. Protocol GitHub Actions were retired on 2026-11-04; retained files and historical results do not imply a new hosted build or attestation.
