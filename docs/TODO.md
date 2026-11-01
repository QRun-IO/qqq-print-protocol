# TODO

## Script quality gates

- [x] Pin Ruff, strict Pyright, ESLint/Stylistic and strict checkJs with locked restores; reject untracked-scope Python/JavaScript and zero-file Pyright runs; negative tool probes pass locally.
- [ ] Observe the new `verify` job steps pass on hosted CI before relying on them.

## Echo media integration

- [x] Define bounded queue-default profile and exact revision selection schemas.
- [x] Validate positive fixtures and reject invalid/ambiguous options.
- [ ] Qualify matching client discovery and stale-profile refusal before spooling.
- [ ] Qualify current-user operator catalog, submission and replay authorization.
- [ ] Qualify atomic retained-source acceptance and lost-response reconciliation.
- [ ] Publish the reviewed immutable contract and compatible consumer tuple.

## Realtime 0.3.0-rc.1 release candidate

- [x] Freeze printing extension 2.0, authenticated realtime frames and independent
  streamed HTTPS documents with no polling fallback.
- [x] Define all 23 required settings, including configurable native submission
  timeout, client ceilings and explicit policy refusal.
- [x] Pass 71 schema definitions, 73 fixtures, local bundle creation, Markdown
  lint and whitespace checks without changing runtime or publishing assets.
- [x] Review and commit the protocol, then pin that immutable commit in both
  consumer CI workflows.
- [ ] Complete consumer transport/replay, slow-transfer control, concurrency and
  authorization acceptance before release; schema checks do not establish them.
- [ ] Complete installed UI and physical output acceptance separately.

## Historical 0.2 and earlier implementation checkpoints

The entries below retain their original checkpoint status. They do not describe
the current realtime release's completion or publication.

- [ ] Qualify semantic discovery, current-user authorization, device binding,
  session renewal and the shared native PKCE callback in both consumers.

- [x] Freeze additive device-control routes, desired state, actions and receipts
  with both consumer owners; document bounded timestamped idempotency.
- [x] Validate 41 definitions and 52 synthetic fixtures with Node 24.22.0.
- [ ] Review matching server and Windows state, authority, replay, expiry, and
  exact spool-ownership tests before adopting the new immutable protocol pin.
- [ ] Coordinate proposed `0.2.0-rc.1` version and release after feature gates;
  no production 1.0 or installation qualification follows from schema checks.

- [ ] Verify security-gated artifact promotion and public build provenance for 0.1.4-rc.1.
- [x] Audit PR #2 at 7f3fa6b passes all hosted checks; downloaded CI archive checksum verified. Tagged release and published attestation remain pending.
- [x] Shared wire v1 remains compatible during the retention/storage and Windows audit fixes, including optional bounded printer pagination.
- [x] User confirmed laser PDF and Zebra ZPL/PDF output with the previous implementation releases; barcode scanning remains unverified.

- [x] Run `npm run check` for the additive profile and history-pagination extension:28 definitions,21 fixtures passed.
- [x] Both downstream fixture pins use a0de93b; remote CI41126317410 passed.

- [x] Freeze v1 endpoints and cross-language DTO names.
- [x] Create JSON schema and enrollment/inventory/job/event fixtures.
- [x] Verify sample content integrity and fixture structure.
- [x] Consume shared fixtures in Java HTTP tests.
- [x] Consume shared fixtures in .NET tests.
- [x] Verify live local server/connector round trip and user-confirmed real laser output, including installed LocalSystem service.
- [x] User confirmed built-in Zebra ZPL and PDF output with the previous implementation releases; scanning and measured alignment remain separate checks.
- [x] Add public repository documentation, license, schema validation CI and release archive tooling.
- [x] Verify required GitHub schema, security, CodeQL and PR checks on the final audit source.

WebSocket notifications, automatic uncertain-outcome reconciliation, destination CRUD and sustained fleet throughput qualification remain outside this prerelease. The documented explicit cancellation and retry endpoints are implemented.

- [x] Complete the independent baseline scan and current-source review of its five Windows/server findings and remediations; no distinct protocol finding was reported.
- [ ] Complete installed Windows and deployed QQQ/S3 qualification separately; see each implementation repository for those acceptance gates.
