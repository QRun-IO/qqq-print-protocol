# Session state — 2026-11-01

## Echo printer media contract in progress

Isolated branch `feat/echo-media-contract-20261101` adds configured Windows
queue-default profiles and an exact ID/revision job selection. See
[Printer media contract](PRINTER-MEDIA.md). Strict schema checks pass 76
definitions and 78 synthetic fixtures, including invalid media and conflicting
dimension options. These tests establish the draft wire shape only.

Matching Windows discovery/revalidation, least-privilege operator catalog and
submission, and atomic retained-source adoption are active in separate consumer
branches. The server source targets extension 2.3.0 (2.2.0 is rendering on protected main); no compatible published
consumer tuple is qualified yet. The installed 0.3.2 client does not advertise
this capability. No physical output was submitted.

## Realtime contract implementation

Isolated branch `feat/realtime-printing-20261031` defines printing extension 2.0,
authenticated client-initiated WSS, direct controls/events/receipts and streamed
same-origin HTTPS documents without job/control polling or fallback. The frozen
settings include a default single configurable download lane, 100 MiB PDF,
20 MiB ZPL, 100 copies and a configurable 120-second native submission deadline,
with declared client ceilings and explicit validation.
Slow-transfer control delivery, lost-connection replay, claim reconciliation and
no-duplicate-submission checks are required consumer acceptance, not claims made
by schema validation. Release candidate `0.3.0-rc.1` is described in
[the complete contract](REALTIME.md); this source checkpoint records no live changes.

The native API major is 2 because an authenticated synchronized WebSocket is now
mandatory for claims that 1.0 clients could previously make over HTTP alone.
Product 0.3, framework `/qqq/v1`, wire payload v1 and the v1 subprotocol remain
unchanged. A new fixture covers the standard printing extension descriptor;
historical legacy discovery fixtures remain unchanged.

Locked offline dependency restore, `npm run check` and `npm run bundle` passed
for this source: 71 JSON Schema definitions and 73 synthetic fixtures, including
the final native submission deadline, all 23 required settings, invalid policy
bounds, directional frames and exact replay. The eight changed Markdown documents
passed Markdown lint; `git diff --check` passed. The local archive is preparation
only; both consumers pin reviewed protocol commit `df3729ac632d4a34a3fb8423acef465042a624fc`.
Tag publication and asset provenance must be checked on the release workflow.

## Historical 0.2 implementation checkpoint — standard-session transport

The new Windows client uses discovered semantic extension `printing` version
`1.0.0` at `/qqq/v1/qbit/printing`, channel `api/qqq-print-agent`, with standard
QQQ sessions and secondary device proof. Legacy bearer transport is explicit
compatibility only. See `QQQ-AUTHENTICATION.md` for current-user/device binding,
server-owned refresh and the exact private desktop callback. Authentication and
consumer integration gates are pending; schema validation is not browser-login
or deployment acceptance. Root added the authoritative printing-session identity
contract and verified all 42 definitions and 54 fixtures successfully. The native
authentication boundary also rejects bound device tokens on legacy routes and
disables legacy enrollment by default in native hosts; only eligible unbound
identities retain explicit migration compatibility. This clarification changes
no schema, fixture or consumer pin.

## Historical 0.2 implementation checkpoint — device-control review

Isolated branch `feat/server-device-controls-20261031` adds the frozen wire-v1
control contract in `docs/DEVICE-CONTROLS.md`. Server and Windows owners received
the same route, action, state, and receipt names. Admin requests require stable
`requestId` plus `issuedAt`; the age check prevents stale re-execution after
terminal history expires. Permanent revocation, desired-state observation,
queued-only clear, and exact owned spool cancellation remain distinct.

Node 24.22.0 local `npm run check` passed 41 schema definitions and 52 fixtures,
including legacy discovery and invalid control targets, commands, timestamps,
capabilities, response bounds, and receipt claims. The strict schema gate first
caught a missing branch-local property declaration; it was corrected before the
passing run. These are protocol checks, not live consumer or printer acceptance.
The proposed package version is `0.2.0-rc.1`; package metadata remains at the
published version pending coordinated review. No commit, push, release, install,
network service call, or physical print occurred in this work.

## Published release checkpoint — 2026-10-31

The compatible contract bundle [v0.1.4-rc.1](https://github.com/QRun-IO/qqq-print-protocol/releases/tag/v0.1.4-rc.1) is published. Earlier candidate and publication-pending entries below describe their original checkpoint. The coordinated Windows and QBit audit prereleases are also published; machine installation, local-host acceptance, physical output and production storage qualification have their own evidence and must not be inferred from this contract release.

The wire remains `/printing/v1` with integer protocolVersion validation. Distribution SemVer does not provide runtime feature negotiation. No API behavior or schema changed in this documentation follow-up.

## Audit candidate 0.1.4-rc.1

Wire v1 remains compatible. Optional management printer pagination adds bounded pages and an opaque nextCursor; existing cursor-free responses remain valid. Capacity and document-expiration errors are documented. `npm run check` passes **29 definitions and 23 fixtures**, including cursor type/length and page-overflow regressions.

Draft PR #2 passed every required hosted check at `7f3fa6b`: schema/fixture validation, security, CodeQL and PR checks. The downloaded CI archive checksum was verified. Publication promotes the tested archive and includes provenance; tagged publication and verification of the public attestation are the remaining protocol release steps. The independent baseline scan completed without a distinct protocol finding, and the five Windows/server findings were remediated and independently reviewed.

Protocol publication is independent of machine installation. Windows installed-upgrade and deployed QQQ/S3 qualification remain separate system gates; publishing this compatible contract does not establish those outcomes. Main-branch required checks apply to administrators too.

Master communications are in `R:\agent-comms\qqq-cloud-printing.md`; both other masters acknowledged ownership and retention boundaries.

## Historical checkpoints

2026-10-30 source 0.1.2-rc.1: additive v1 DeviceProfile in heartbeat, optional printer displayName/description/location, explicit null-preserve/empty-clear behavior, 512/4096/1024 character bounds and admin keyset job history cursor documented. Added two shared profile fixtures and boundary invalid-input checks. `npm run check` passed: 28 schema definitions,21 fixtures plus integrity/invalid-input checks. Both implementations pin fixtures to a0de93b. Exact-source GitHub CI41126317410 passed; release publication is coordinated by root. Existing wire IDs and physical printer name semantics remain unchanged.

2026-10-29: v1 happy-path contract created for QQQ 4.1+ and AppKit Windows connector. HTTPS polling; device enrollment, discovery/approval, PDF/ZPL job submission, claims, content and events. No commits or publication.

Verification: `node tools/verify-fixtures.mjs` passes 17 fixtures, ZPL SHA-256/base64/length checks and three invalid-input checks. Both implementation agents received wire routes, types and review findings.

Java compatibility: added `PrintingContractTest.java` in the server agent's explicitly delegated test file. `mvn -q '-Dtest=PrintingContractTest' test` passed against real loopback Javalin/H2: enrollment, discovery/approval, submission/idempotency, claim, content integrity, state events, status reads and device/admin auth separation. Tests use sibling fixtures, configurable with `printing.protocol.fixtures`.

Integration owners: sibling `qbit-printing`, `qqq-print-agent`, and root-owned `cloud-printing-integration`. Contract authority: README and schemas/protocol.schema.json. Fixtures contain synthetic identities only.

Publication preparation: version 0.1.0-rc.1, Apache-2.0 license, integration/contribution/security/changelog documentation, SHA-pinned GitHub validation/release workflow, locked development-only Ajv validators and archive/checksum tooling added. `npm run check` passes all 25 definitions/17 fixtures; `npm run bundle` creates the prerelease archive. Parent owns repository creation, commits, pushes and releases. GitHub CI execution is not yet claimed.

Publication checks: `actionlint .github/workflows/ci.yml` passed. Locked npm install audited seven packages with zero reported vulnerabilities. A mismatched release tag is rejected by the bundle tool. Initial CLI and installed LocalSystem service PDF output were physically confirmed by the user; Zebra remains pending.
