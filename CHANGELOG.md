# Changelog

## 0.4.0-rc.1 — unreleased

- Add bounded machine-default media profiles and exact job profile/revision
  selection; refuse ambiguous dimension overrides.
- Define the least-privilege operator catalog, submit and read-only request
  recovery contracts, including stable actor-scoped request keys.
- Add `printer-media-v1` capability negotiation; selected-profile jobs require
  a supporting current client, including after capability downgrade/reconnect.
- Retain wire version 1 and the realtime transport. Printing extension 2.2.0
  advertises the additive native routes. Consumer runtime, installed and physical
  acceptance remain required before a coordinated release.

## 0.3.0-rc.1 — 2026-10-31

Upgrade the server before the matching Windows connector. Native printing API
2.0 requires synchronized authenticated WSS; the wire payload version remains 1.

- Define printing semantic extension 2.0 with an authenticated outbound WebSocket
  for direct controls, events, receipts and job notifications; prohibit polling
  fallback while retaining existing wire-v1 domain payloads.
- Mark the mandatory channel prerequisite for native claims as a breaking API
  change from extension 1.0; framework `/qqq/v1` and the v1 subprotocol stay unchanged.
- Specify durable reconnect reconciliation, exact ACK replay and independent
  same-origin HTTPS streaming for large documents.
- Add validated administrator settings and declared client ceilings for document
  sizes, copies, queues, concurrency, bandwidth, liveness and timeouts, including
  the native submission deadline.
- Add strict frame/settings schemas, synthetic fixtures and negative validation.
  Consumer transport, installed UI and physical output acceptance remain separate.

## 0.2.0-rc.1 — 2026-10-31

- Add optional wire-v1 device-control discovery and independent control polling.
- Specify server dispatch/connection controls, irreversible credential revocation,
  inventory refresh, queued-only cancellation, and exact owned spool cancellation.
- Define expiring commands, durable replayable receipts, bounded history, and
  timestamped admin requests that cannot execute again after retention pruning.
- Add synthetic schema fixtures and invalid-input checks; physical output and
  consumer implementation acceptance remain separate gates.
- Specify the native semantic printing API, standard QQQ session authorization,
  secondary bound-device proof and authoritative session identity fixtures.
- Require bound devices to use native user sessions on every device route;
  legacy compatibility cannot downgrade secondary proof into primary authority.
  Native hosts disable legacy enrollment by default.

## 0.1.4-rc.1 — 2026-10-30

- Gate publication on security checks, promote the tested archive and verify packaged checksums.
- Add GitHub build provenance attestations and disable npm caching in the release-producing job.
- Add optional management printer pagination with bounded pages and compatible cursor-free responses; retain wire v1.
- Document capacity rejection and document-expiration responses without changing existing device requests.

## 0.1.3-rc.1 — 2026-10-30

- Optional testProfile selects Letter, A4 or 4 × 6 label layouts at 203/300/600 dpi without changing wire v1.
- Existing requests remain valid; incompatible ZPL media, null/unknown profiles and missing request identity are rejected.
- Schema gate covers 29 definitions and 22 fixtures, including explicit 300-dpi test requests.

## 0.1.2-rc.1 — 2026-10-30

- Optional v1 heartbeat device profile and printer display-name/description/location fields, preserving physical queue names and identifiers.
- Explicit absent/null/preserve and empty/clear semantics; bounded long-name support and two new compatibility fixtures.
- Schema/fixture gate validates 28 definitions and 21 fixtures, including existing v1 clients.

## 0.1.0-rc.1 — 2026-10-29

Initial prerelease of protocol v1 for QQQ 4.1+ cloud printing.

- Single-use enrollment and device bearer credentials.
- Printer discovery, local exposure selection and separate server approval; omitted queues become unavailable for new claims.
- PDF/ZPL submission, idempotency, job claims and authenticated document download.
- SHA-256/length verification and acknowledged lifecycle events.
- JSON Schema 2020-12, 17 shared compatibility fixtures and synthetic ZPL content.
- Schema/fixture CI and versioned archive/checksum release artifacts.

The first transport uses outbound HTTPS polling. Custom paper dimensions, WebSocket notifications, cancellation, automatic uncertain-outcome reconciliation, destination management and advanced fleet behavior are not part of this initial implementation.
