# Printer media contract

This additive contract is under implementation for the Echo integration. It is
not advertised by the installed 0.3.2 client. Existing wire version 1 and the
WebSocket subprotocol remain unchanged. The server extension is 2.2.0 in the
implementation branch; immutable consumer artifacts must be qualified together
before publication. Older 2.x deployments do not promise the operator routes.

A client advertising `printer-media-v1` reports optional `mediaProfiles` in each
exposed printer's inventory. The initial implementation reports at most one
configured machine-wide Windows queue default. An absent or empty list means
that qualified dimensions and resolution are unavailable; callers must not guess.

Each profile contains `id`, `revision`, `name`, `widthMicrons`, `heightMicrons`,
`dpiX`, `dpiY`, `source: WINDOWS_QUEUE_DEFAULT` and `applyMode: DRIVER_DEFAULT`.
Dimensions are positive integer microns, at most 2,000,000. Resolution values are
positive integer dots per inch, at most 9,600. The display name has at most 512
characters. Inventory permits at most 32 profiles per printer.

The ID is opaque and stable for that queue default. The revision is a lowercase
64-character SHA-256 fingerprint of the effective configuration, including driver
identity and relevant default settings. It is a concurrency binding, not an
authentication credential. Neither value should be reconstructed by a consumer.
Profile IDs use the existing 1–128-character URL-safe ID contract. Catalog device
names allow up to 1,024 characters, including legacy computer-name fallbacks;
screens wrap these labels without changing their selection values.

Submit the selected `options.mediaProfile: {id, revision}` verbatim. Combining it
with `paperWidthMm` or `paperHeightMm` is invalid. The server validates the exact
currently authorized destination and advertised selection and includes both
values in the immutable acceptance/idempotency binding. The client rechecks the
profile before native spool submission and refuses stale or unavailable profiles.
The server also requires the currently connected client to advertise
`printer-media-v1` before claiming a selected-profile job. Capability replacement
on reconnection must remove stale support; old clients cannot safely ignore the
selection. Adding this value to historical control-capability DTOs preserves their
schema compatibility and does not introduce a polling transport.

`DRIVER_DEFAULT` does not change stock or Windows defaults. Reported dimensions
describe configured defaults, not a physical stock sensor. Renderer fit, barcode
encoding and quiet zones belong to Document Generation. PDF page dimensions
alone do not configure the printer.

The operator catalog and submission use normal QQQ current-user, tenant and row
authorization. Operator access does not grant device management or queue control.
Retained-source submission must atomically bind the exact source version, digest,
length, initiating actor, request and destination with the durable acceptance
receipt. Acceptance means a committed queue entry; it does not prove paper output.
Lost responses reconcile the same request key rather than issuing a new request.

The draft native routes below are relative to the discovered printing extension
path, behind the standard QQQ authentication and authorization layers:

| Operation | Contract |
| --- | --- |
| `GET /operator/printers` | `OperatorPrinterList`; `limit` is 1–200 (default 50), `after` is the opaque returned cursor. |
| `POST /operator/jobs` | `OperatorSubmitJobRequest` to committed `PrintJob`. |
| `GET /operator/requests/{requestId}` | The same actor/tenant's current authorized `PrintJob`, or 404. |

Catalog entries include native `printerRowId` and device identity, effective
`name` and `deviceName`, status, formats and profiles. IDs are selection values;
screens display the names. The catalog excludes disabled, unapproved, unexposed
and unauthorized destinations. The continuation cursor follows stable row order;
clients continue until `nextCursor` is null, including after an empty filtered page.

Submission provides `requestId`, `printerRowId`, `title`, `format`,
`contentBase64` and optional `options`. The request ID is 1–128 ASCII letters,
digits, dots, underscores, colons or hyphens, so `echo:<scanId>` is supported.
The server derives the initiating actor and tenant from current QQQ authority;
these cannot be supplied in the request. Existing configured format/document
limits apply. Changing destination, content or options under the same request
key must conflict, rather than accept another job. Successful reconciliation
still requires current destination authority. The retained-source Java facade
uses the same queue and authorization boundary; it does not send source bytes
through a second queue or replace retained-owner admission policy.

The synthetic fixture uses 4 by 6 inches at 300 DPI only as schema test data. It
does not report the resolution or current configuration of any real printer.
