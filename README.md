# QQQ Print Protocol v1

Shared contract for the [QQQ 4.1+ printing QBit](https://github.com/QRun-IO/qbit-printing) and [Windows AppKit connector](https://github.com/QRun-IO/qqq-print-agent). The coordinated [realtime extension 2.0](docs/REALTIME.md) uses a client-initiated authenticated WebSocket for controls, receipts and job notifications, with separate streamed HTTPS documents and no polling fallback. This contract is authoritative for wire names; language types may use their idiomatic naming.

Current release candidate: [**0.3.0-rc.1**](https://github.com/QRun-IO/qqq-print-protocol/releases/tag/v0.3.0-rc.1). Previous distribution: [**0.2.0-rc.1**](https://github.com/QRun-IO/qqq-print-protocol/releases/tag/v0.2.0-rc.1). Wire protocol: **v1**. This repository supplies specification, JSON Schema and synthetic compatibility fixtures; install the Windows connector and integrate the QBit from their own repositories to print documents.

The next candidate, **0.4.0-rc.1**, adds the [printer media and operator
contract](docs/PRINTER-MEDIA.md) for printing semantic extension **2.3.0** (see the
[extension version registry](docs/VERSIONS.md); 2.2 is rendering only). It is
under consumer qualification and is not a published release. Media profiles
represent configured Windows queue defaults with exact revision binding;
operator access uses normal current-user and tenant authorization without
granting device management. The installed 0.3.2 client does not support these
profiles. Wire version 1 and the client-initiated realtime transport stay the same.

Use Node.js 24+ to run the development checks:

```sh
npm ci --ignore-scripts
npm run check
npm run bundle
```

The release archive and `SHA256SUMS` are written to `dist/`. Schema/fixture consumers do not require Node.js or the development validators. See [consumer integration and versioning](docs/INTEGRATION.md), [contributing](CONTRIBUTING.md), [security reporting](SECURITY.md), and the [changelog](CHANGELOG.md). Licensed under [Apache-2.0](LICENSE).

| Directory | Contents |
| --- | --- |
| `schemas/` | JSON Schema 2020-12 definitions for each request/response |
| `fixtures/` | Language-neutral examples and a synthetic ZPL test document |
| `tools/` | Schema/fixture validation and release bundle tooling |
| `docs/` | Integration instructions and local implementation checkpoints |

## Conventions

The realtime implementation requires printing semantic extension `>=2.0.0 <3.0.0`; wire payload version remains `1`. Its settings, frames, replay rules and required consumer acceptance are in [REALTIME.md](docs/REALTIME.md). Upgrade the server before the matching Windows connector; installed and physical-output acceptance remain separate from this contract release. The HTTP polling sequence below documents the earlier 1.0/explicit compatibility transport, not a fallback for a realtime client.

Primary native base: `/qqq/v1/qbit/printing`, discovered as QQQ semantic extension `printing`, using standard QQQ user authentication and secondary device proof. Realtime requires extension `2.0.0`; the earlier HTTP transport uses `1.0.0`. See [QQQ authentication](docs/QQQ-AUTHENTICATION.md). The routes below describe explicit legacy compatibility at `/printing/v1`; native authentication failure never silently selects that transport. JSON uses UTF-8, camelCase properties, uppercase enum strings, and RFC 3339 UTC timestamps. IDs are opaque case-sensitive strings using URL-safe characters. Consumers ignore unknown response fields for compatible additions. Breaking changes require a new major contract. Configure the complete server origin; production requires HTTPS. Explicit localhost-only development may use HTTP.

Use `Content-Type: application/json` except the content-download response. The explicit legacy endpoints below use `Authorization: Bearer <token>`. Device tokens and admin credentials are distinct; a device token must never authorize `/admin` operations. Legacy enrollment uses only the single-use code in its request body. Never put credentials in query strings or log them.

The host application authenticates management requests and determines authorized tenant/facility scope. A standalone local test host may use a configured administrative bearer credential. Device ownership, tenant and facility are taken from server records, not trusted request fields.

## Endpoints

| Method/path | Request | Successful response |
| --- | --- | --- |
| POST `/admin/enrollments` | `CreateEnrollmentRequest` | 201 `EnrollmentCode` |
| POST `/enroll` | `EnrollRequest` | 200 `EnrollResponse` |
| POST `/device/heartbeat` | `HeartbeatRequest` | 200 `HeartbeatResponse` |
| PUT `/device/printers` | `PrinterInventory` | 200 `Acknowledgment` |
| POST `/device/jobs/claim` | `{}` | 200 `ClaimResponse`; `job:null` when empty |
| GET `/device/jobs/{jobId}/content` | none | 200 binary content |
| POST `/device/jobs/{jobId}/events` | `JobEvent` | 200 `Acknowledgment` |
| GET `/admin/devices` | none | 200 `{ "devices": [Device] }` |
| GET `/admin/devices/{deviceId}/printers` | optional `limit`, `before` query parameters | 200 `PrinterList` |
| PUT `/admin/devices/{deviceId}/printers/{printerId}` | `{ "enabled": true }` | 200 `Acknowledgment` |
| POST `/admin/jobs` | `SubmitJobRequest` | 200 `PrintJob`, including identical idempotent replay |
| GET `/admin/jobs` | none | 200 `{ "jobs": [PrintJob] }` |
| GET `/admin/jobs/{jobId}` | none | 200 `PrintJob` |

Device lists and job lists are scoped by host authorization. Listing pagination and destination/profile CRUD are beyond this first wire contract. Native application code may submit through the QBit service rather than the management HTTP API.

The additive [device-control contract](docs/DEVICE-CONTROLS.md) defines capability
discovery, dispatch pause/resume, operational disconnect/reconnect, permanent
credential revocation, inventory refresh, queued-job clearing, and exact owned
Windows spool cancellation. It uses durable request identities, bounded command
polling, and explicit receipts. These additions are included in the
`0.2.0-rc.1` distribution, with 42 definitions and 54 validated fixtures.

## DTOs

`schemas/protocol.schema.json` defines the DTOs under `$defs`. Validate a message against the corresponding `#/$defs/<Name>`. Example request/response files in `fixtures/` use synthetic identities and nonworking illustrative credentials only.

* `CreateEnrollmentRequest`: `facilityId`, `deviceName`.
* `EnrollmentCode`: `enrollmentCode`, `expiresAt`.
* `EnrollRequest`: `enrollmentCode`, `deviceName`, `agentVersion`.
* `EnrollResponse`: `protocolVersion` (1), `deviceId`, `deviceToken`, `pollIntervalSeconds` (default 5).
* `HeartbeatRequest`: `agentVersion`. Response: `serverTime`.
* `PrinterInventory`: full snapshot of the queues selected for cloud exposure in the local Windows companion, in `printers`. Each printer contains stable `printerId`, exact Windows queue `name`, `driverName`, `portName`, `status`, `formats`. An empty list withdraws every queue. There is no new required exposure field: presence in the snapshot expresses local exposure.
* `PrintOptions`: `copies` defaults to 1; `scale` defaults to `ACTUAL_SIZE`. The schema reserves optional `paperWidthMm`, `paperHeightMm` (which must appear together), but the initial implementation rejects them until per-job paper configuration is implemented. Configure paper on the Windows queue for now. First implementation supports `ACTUAL_SIZE` and `FIT`. ZPL dimensions are encoded in its payload; copies must be applied exactly once.
* `SubmitJobRequest`: `deviceId`, `printerId`, `title`, `format`, `contentBase64`, `idempotencyKey`, optional `options`.
* `PrintJob`: `jobId`, `printerId`, `title`, `format`, lowercase hex `contentSha256`, `contentLength` (decoded bytes), normalized `options`, `createdAt`, `status`. Management responses additionally include `deviceId` and may include latest `message` and `spoolerJobId`.
* `JobEvent`: stable `eventId`, `status`, optional `message`, optional string `spoolerJobId`.
* `Acknowledgment`: `{ "accepted": true }`.
* `Device`: `deviceId`, `deviceName`, `facilityId`, `agentVersion`, optional `lastSeenAt`.
* `ManagedPrinter`: inventory printer plus `enabled` (server-side approval), and optional additive `available` (present in the latest local exposure snapshot). These represent different decisions; an approved queue can be unavailable.

Formats: `PDF` (`application/pdf`) and `ZPL` (`application/vnd.zebra-zpl`). Content downloads may use `application/octet-stream`; the authenticated job's format is authoritative. ZPL content is UTF-8 printer-ready data. Printer status is `READY`, `OFFLINE`, `PAUSED`, `ERROR`, or `UNKNOWN`. It is a driver observation, not proof that hardware is ready. Formats are advertised adapter capabilities; do not infer ZPL support for every Windows queue.

## Historical HTTP happy-path sequence

1. Administrator creates an enrollment and enters its code plus server URL in the connector.
2. Connector exchanges the code once and securely retains the device identity/token.
3. The user selects which locally discovered queues to expose in the Windows companion/tray. Connector publishes only that selection as a complete inventory snapshot. New printers are disabled until approved. Inventory refresh preserves server approval and does not reactivate a disabled printer. Previously known queues omitted from the snapshot become unavailable for new claims, while their approval and history remain intact.
4. Administrator enables the intended laser/Zebra queues. Application code or the management API submits a document to a specific device/printer.
5. Connector sends heartbeat/inventory refreshes and polls claim approximately every five seconds. Claim atomically selects a queued job for a printer belonging to that device which is both server-approved and currently exposed locally. Omitting a queue must prevent new claims; retaining its old approval is not enough to dispatch to it. The connector also checks its current local selection before submission. Withdrawing a queue cannot retract work already accepted by Windows.
6. Connector persists the job locally, reports RECEIVED, downloads `/device/jobs/{jobId}/content`, verifies byte length/hash, and validates the format/printer mapping.
7. Connector records SUBMITTING locally and reports it before invoking Windows. After success it records and reports SPOOLED, including a spooler reference when available. Submission must not be presented as physical print confirmation.

Content downloads derive authorization from the authenticated device and job assignment. They never accept arbitrary URLs. Default decoded document limit is 20 MiB. Copies range from 1 to 100. Reject empty documents, unsupported formats and unsupported printer capabilities before queuing.

## Minimal delivery rules

### Explicit device operator actions

The additive operator-actions extension requires matching QBit and Windows connector builds. GET `/printing/v1/device/jobs/queued` returns `{ "jobs": [PrintJob, ...] }` for at most 50 queued jobs owned by the authenticated device, without document bytes; the companion combines these with local history for inspection and pre-dispatch cancellation. All routes use the existing device bearer credential and may access only that device's jobs/approved exposed printers:

| POST route | Request | Response |
| --- | --- | --- |
| `/printing/v1/device/test-print` | `DeviceTestPrintRequest` | New `PrintJob` containing a server-generated test document |
| `/printing/v1/device/jobs/{jobId}/retry` | `DeviceRetryRequest` | New `PrintJob`; the original receipt remains unchanged |
| `/printing/v1/device/jobs/{jobId}/cancel` | Empty JSON object | `Acknowledgment`, only while the job is still QUEUED |

Test/retry requests carry a stable requestId for transport retries. The key includes device and original job where applicable. Retrying FAILED is explicit; SPOOLED, SPOOLER_COMPLETED and OUTCOME_UNKNOWN additionally require confirmDuplicateRisk=true after the operator inspects output. Cancel is serialized against claim and refuses CLAIMED or later work. A pre-dispatch cancel is recorded as FAILED with an operator-cancellation message, preserving the v1 status vocabulary. Once Windows has accepted a job, a separate local spooler cancellation can only request a stop; it cannot guarantee no output. It must verify the spooler document identity before acting on a reused numeric spool ID.

The companion never automatically retries an operator print action after a timeout. It instructs the operator to inspect QQQ job history before submitting again. A server without these additive routes returns 404 and the companion reports that the printing QBit needs updating.

States: `QUEUED → CLAIMED → RECEIVED → SUBMITTING → SPOOLED`. The connector may report `FAILED` for definite failure or `OUTCOME_UNKNOWN` for an ambiguous submission. `SPOOLER_COMPLETED` is reserved for observed spooler completion; it is not required in the happy-path implementation.

Claim may return the same outstanding CLAIMED job when an earlier response was lost. Never automatically return an already RECEIVED/SUBMITTING/SPOOLED job as new work. The local journal deduplicates by jobId. Repeated eventIds with the same body are accepted without a second transition; conflicting reuse returns 409. Late events must not regress the state. An HTTP retry must reuse its eventId.

A business idempotency key is scoped to the authorized tenant. The same key plus the same printer/document/options returns the existing job. Different input under that key returns 409. Persist before returning success. A reprint uses a new key.

Once spool submission may have occurred, never blindly submit again after restart. Retain OUTCOME_UNKNOWN for review. The first implementation need not implement automated reconciliation, cluster leases, cancellation or failover to preserve this rule.

## Client names, descriptions and locations

This additive v1 extension keeps device IDs and printer IDs stable. The Windows client owns these labels; QQQ displays the synchronized values in its native record forms and selectors. Server approval and local printer exposure remain separate controls.

`POST /printing/v1/device/heartbeat` accepts optional `profile: { name, description, location }`. Printer inventory entries accept optional `displayName`, `description` and `location`; their existing `name` remains the physical Windows queue name. Missing or null metadata fields preserve the previous value, supporting older clients. Explicit empty strings clear fields; an empty friendly name falls back to the computer or physical queue name. Friendly names and locations allow 512 characters, descriptions 4096, physical computer/queue names and job titles 1024. No field changes printer routing identity. Over-limit values return 400.

Management device responses additionally include `computerName` and `profile`. Managed printer responses include the three optional profile fields. Descriptions may contain line breaks. Client labels are operational data, not credentials, and must not be interpreted as HTML or SQL.

## Bounded job history

`GET /printing/v1/admin/jobs?limit=200&before=<nextCursor>` returns `{ jobs: [PrintJob, ...], nextCursor: string|null }`. The default and maximum limit is 200, minimum 1. Pass the opaque cursor unchanged to obtain the next older page; a null cursor means the end. The tenant remains bound to administrator authorization, never to cursor contents. Lists exclude document bytes. This keyset pagination is additive; clients reading only `jobs` retain their previous bounded first-page behavior.

Device queued inspection remains the oldest 50 QUEUED jobs. Claim returns a single eligible job; content is downloaded separately after claim. A local list is a bounded operational window, not a statement that older history or a larger backlog does not exist.

`GET /printing/v1/admin/devices/{deviceId}/printers?limit=200&before=<nextCursor>` returns `{ printers: [ManagedPrinter, ...], nextCursor: string|null }`. Limit defaults to 200 and must be between 1 and 200. Pages follow ascending display name and stable row identity; pass the opaque cursor unchanged. The host rechecks device and tenant scope on every page. Existing clients can continue reading the bounded `printers` array. Discovery snapshots still contain at most 200 queues; configurable cumulative history limits prevent repeated fresh IDs from growing inventory indefinitely, while preserving approved and job-referenced records.

## Errors

Error body: `{ "code": "ERROR_CODE", "message": "Human-readable explanation" }`.

* 400: malformed request, missing required field, invalid format/options.
* 401: missing/invalid/revoked token, invalid or expired enrollment code.
* 403: authenticated identity lacks permission.
* 404: unknown object or object outside the device's scope (avoid cross-device disclosure).
* 409: idempotency conflict, enrollment already used, invalid lifecycle transition.
* 410: the delivery document expired under the host retention policy. Submit a new document explicitly; an existing idempotent receipt remains valid.
* 413: document or request exceeds configured limit.
* 429: host queue, retained-document, inventory or request-rate capacity is exhausted. Respect the host's capacity policy; retry the same request identity with bounded backoff after capacity becomes available. Do not create fresh identities to evade limits.
* 503: transient server failure; retry transport operations with bounded backoff. A timeout does not prove a physical print failed.

## Verification

`npm run check` compiles every JSON Schema 2020-12 definition with Ajv and validates all shared fixtures, then checks ZPL bytes/hash/base64 and representative invalid inputs. The two pinned development dependencies are solely for standards-compliant schema validation; they do not enter either printing implementation's runtime.

`node tools/verify-fixtures.mjs` remains a dependency-free subset check. Java and .NET implementations should consume these exact fixtures in protocol tests, pinned to a reviewed immutable protocol commit. The Java HTTP round trip and .NET fixture compatibility checks passed during initial development. CI configuration is included; a local check does not imply that GitHub CI has run.

## Branded test-document profiles

`DeviceTestPrintRequest` optionally includes `testProfile`. PDF accepts `LETTER`, `A4`, or a `LABEL_4X6_*` profile (all label profiles produce the same 101.6 × 152.4 mm PDF). ZPL accepts `LABEL_4X6_203`, `LABEL_4X6_300`, or `LABEL_4X6_600`; the suffix selects the printer resolution in dots per inch. Use possible-value selectors in operator interfaces and match the loaded stock and device resolution. The profile defines document layout; it does not reconfigure Windows paper stock.

Requests that omit the field retain compatible defaults: PDF uses Letter, ZPL uses 4 × 6 at 203 dpi. An explicit null, unknown profile, or Letter/A4 with ZPL is invalid. A stable requestId protects transport retries; changing document media is a new operator request. Each action queues one test on each explicitly selected destination, subject to the existing exposure and approval checks. No discovery or connection event automatically prints.

The QQQ implementation generates branded diagnostic content using an embedded warehouse-readable font for PDFs and rasterized glyphs in printer-ready ZPL. This avoids relying on resident printer fonts for identification text. Physical legibility, alignment and barcode readability still require output inspection.
