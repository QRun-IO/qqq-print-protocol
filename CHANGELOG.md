# Changelog

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
