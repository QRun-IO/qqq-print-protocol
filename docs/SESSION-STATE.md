# Session state — 2026-10-30

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
