# Changelog

## 0.1.0-rc.1 — 2026-10-29

Initial prerelease of protocol v1 for QQQ 4.1+ cloud printing.

- Single-use enrollment and device bearer credentials.
- Printer discovery, local exposure selection and separate server approval; omitted queues become unavailable for new claims.
- PDF/ZPL submission, idempotency, job claims and authenticated document download.
- SHA-256/length verification and acknowledged lifecycle events.
- JSON Schema 2020-12, 17 shared compatibility fixtures and synthetic ZPL content.
- Schema/fixture CI and versioned archive/checksum release artifacts.

The first transport uses outbound HTTPS polling. Custom paper dimensions, WebSocket notifications, cancellation, automatic uncertain-outcome reconciliation, destination management and advanced fleet behavior are not part of this initial implementation.
