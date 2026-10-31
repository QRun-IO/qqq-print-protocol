# Realtime printing — semantic extension 1.1

This is the contract for the unreleased `0.3.0-rc.1` realtime implementation.
It does not establish publication or installed acceptance. Existing job states, command outcomes,
current-user authorization and durable idempotency rules remain authoritative.

## Discovery and connection

Require QQQ printing semantic extension `>=1.1.0 <2.0.0`, discovered through
`/qqq/v1/version`, and the existing core API/channel/authentication gates.
A 1.0 server is upgrade-required for this client. Do not infer support from a
socket accepting a connection, a saved version, or a prior enrollment.

The client opens one persistent WebSocket to the configured QQQ origin:

- Route: `/qqq/v1/qbit/printing/device/realtime`.
- Subprotocol: `qqq-printing.v1`; the server must select this exact value.
- Scheme: `wss`; `ws` is allowed only for explicitly configured loopback development.
- Upgrade authentication: standard QQQ session cookie,
  `X-QQQ-Device-Id`, `X-QQQ-Device-Token`, `X-QQQ-Client: api/qqq-print-agent`
  and the canonical same-origin `Origin`.
- Capability: `realtime-v1` is mandatory in `HELLO`. Optional command capabilities
  are the existing `REFRESH_INVENTORY` and `CANCEL_SPOOL`.

Do not add credentials to URLs, subprotocols, logs or frame payloads. Refuse
cross-origin redirects and arbitrary content URLs. The existing session is
primary authority; device proof never replaces it. See [QQQ authentication](QQQ-AUTHENTICATION.md).

Authenticate the upgrade and revalidate the current session, principal/device
binding, tenant and operation-specific permissions for each incoming operation
and outgoing delivery. Revalidate on liveness traffic too; an idle connection
cannot preserve expired or withdrawn authority indefinitely. Use the normal QQQ
session-resume flow; provider refresh stays on the server. When the session
credential changes, reconnect with the current credential while retaining the
same authoritative device/journal scope. No private WebSocket token is created.

There is one active authenticated connection per device. A new connection
supersedes the old generation. A late close, ACK or callback from an older
generation cannot close or acknowledge the replacement. A connection ID and
message order identify transport ownership, never user authority.

## Frames

Only UTF-8 JSON text messages are accepted. Each complete message has
`{ "type": "...", "messageId": "...", "payload": { ... } }`.
Use the existing URL-safe `Id` alphabet and 200-character bound; use hyphens,
not colons, in generated prefixes. Bound the reassembled message, not merely an
individual WebSocket fragment, by `maxFrameBytes`. Binary/document messages and
compression that could bypass decoded-size limits are not supported.

| Direction | Type | Payload |
| --- | --- | --- |
| Client → server | HELLO | `agentVersion`, `capabilities`, `lastAppliedRevision`, `lastSettingsRevision`, `limits` |
| Server → client | WELCOME | `connectionId`, `serverTime`, `desiredState`, `settings` |
| Client → server | STATE_APPLIED | `lastAppliedRevision`, `lastSettingsRevision` |
| Server → client | DESIRED_STATE | Existing `DeviceDesiredState` directly |
| Server → client | SETTINGS | `RealtimeSettings` directly |
| Server → client | JOB_AVAILABLE | Empty object; a coalescible wake-up, not a job or claim |
| Server → client | COMMAND | Existing `DeviceCommand` directly |
| Client → server | JOB_EVENT | `jobId`, existing `JobEvent` as `event` |
| Client → server | COMMAND_RECEIPT | `commandId`, existing `DeviceCommandReceipt` as `receipt` |
| Client → server | HEARTBEAT | Existing `HeartbeatRequest` directly |
| Client → server | INVENTORY | Existing `PrinterInventory` directly |
| Client → server | PING | Empty object; liveness only |
| Server → client | PONG | `serverTime` |
| Server → client | ACK | `acknowledgedMessageId` |
| Server → client | ERROR | `code`, safe `message`, `retryable` |

The settings payload schema is `RealtimeSettings`; its envelope schema is
`RealtimeSettingsMessage`. The directional unions are `RealtimeClientMessage`
and `RealtimeServerMessage`. An ERROR responding to a frame uses that frame's
`messageId`; connection-level errors use a fresh ID. Never treat an ERROR as
a successful ACK or erase the corresponding durable event/receipt.

Canonical error codes include AUTHORIZATION_REQUIRED, CONFIGURATION_REQUIRED,
INVALID_MESSAGE and OPERATION_FAILED. Preserve domain NOT_FOUND, EXPIRED and
CONFLICT distinctions for 404/410/409 outcomes, including the existing bounded
pruned-receipt retirement rule. Only transient failures set `retryable:true`;
unknown codes remain explicit errors, never permission to fall back or drop work.

HEARTBEAT is periodic small status/profile traffic over this socket. INVENTORY
runs on initial synchronization, actual local changes or an explicit refresh
command; it is not an HTTP polling loop. PING/PONG may maintain liveness without
refreshing inventory or querying jobs/controls. Only one serialized writer owns
socket sends; the receive/control path must not await document download,
rendering, printer submission or UI work.

## Ordering, synchronization and replay

1. Authenticate the connection, then require HELLO before other application work.
   Its revision values report previously persisted observations, not authority.
   Subscribe to committed changes before taking the initial durable snapshot.
2. Send WELCOME with current settings and desired state. The client validates
   policy and its declared ceilings, persists both revisions and values, applies
   them, and sends STATE_APPLIED. Neither revision may roll back or exceed the
   authoritative revision.
3. Acknowledge STATE_APPLIED only after recording that observation for the active
   connection. New claims require that active authorized connection and both
   current revisions. The client also waits for that matching ACK before claims.
   Remember an early JOB_AVAILABLE until this gate is satisfied.
4. Deliver pending unexpired commands and a coalesced JOB_AVAILABLE for durable
   queued work. Committed desired-state, settings, job and command changes trigger
   delivery. Use a transaction/outbox or post-commit synchronization mechanism
   that cannot lose a change between subscription, snapshot and the empty claim.
5. JOB_AVAILABLE triggers a finite authenticated HTTPS claim drain until empty
   or policy/concurrency capacity is reached. Keep a pending wake while at capacity;
   lane completion resumes that drain. Reaching empty atomically clears the wake
   relative to later committed enqueues. Returning to eligible state after
   resume/reconnect or settings application also wakes the drain.
6. Persist exact JOB_EVENT and COMMAND_RECEIPT envelopes before sending.
   ACK means the same existing authorized service operation committed durably.
   Replay identical message IDs, domain event/receipt IDs and payloads until ACK.
   Lost ACKs must return success for the original committed result; changed
   content for an existing identity conflicts.
7. After network loss, reconnect using configured bounded exponential backoff
   and jitter, repeat HELLO/WELCOME/current-state reconciliation, and replay the
   durable outbox. The server replays pending commands from its durable store;
   notifications and per-connection ordering are not a durable work ledger.

No job, control, heartbeat or receipt HTTP timer is permitted in this transport.
No timeout, 404, socket failure, empty response or unsupported version enables
HTTP polling or bearer fallback. Existing compatibility routes remain explicit
diagnostics for eligible identities, not this client's recovery path.
An implementation that uses timed database polling as its notification source
does not satisfy this contract. Multi-node hosts need shared committed-change
delivery; an in-process event bus qualifies only its documented single-node scope.

Job claims/content stay on their existing authenticated HTTPS routes at the same
origin. A lost claim response must be reconciled with the authoritative assigned
job and local journal on reconnect before claiming unrelated work; it cannot
strand a CLAIMED job or authorize a second physical submission. Initial or
event-triggered bounded HTTPS reconciliation snapshots are allowed, never timers.

The existing command journal decides whether a repeated command is unexecuted,
in progress or terminal. Persist execution intent before a native cancellation;
after uncertain execution return OUTCOME_UNKNOWN, never blindly invoke it again.
The existing receipt-retention and pruned-history rules still apply. A missing
expired server receipt is not fabricated server acceptance.

DISCONNECTED and dispatch pause gate new claims. DISCONNECTED retains the socket,
desired-state updates, commands, receipts and in-flight job events, but suppresses
ordinary HEARTBEAT/inventory publication; PING/PONG still maintains liveness.
REFRESH_INVENTORY waits until CONNECTED or expires. RECONNECT does not clear pause,
and neither control restores revoked credentials. No command restarts Windows,
the service or a printer. A reported spool cancellation cannot recall paper.

## Operational settings and client ceilings

The server is authoritative. Administrators edit validated operational policy
through native QQQ permissions; agents cannot set it. All 23 properties below,
including the server-generated `revision`, are required in each complete settings
snapshot. Never infer an omitted value from a compiled default.

| Property | Default | Inclusive range |
| --- | --- | --- |
| `revision` | Server-generated | 0–9007199254740991 |
| `maxCopies` | 100 | 1–32767 |
| `maxPdfBytes` | 104857600 | 1–2147483647 |
| `maxZplBytes` | 20971520 | 1–2147483647 |
| `maxFrameBytes` | 1048576 | 8192–16777216 |
| `maxQueuedFrames` | 64 | 8–4096 |
| `maxQueuedFrameBytes` | 4194304 | 8192–67108864 |
| `maxConcurrentDownloads` | 1 | 1–16 |
| `maxConcurrentPrints` | 1 | 1–16 |
| `maxStagedBytes` | 536870912 | 1–9007199254740991 |
| `maxDownloadBytesPerSecond` | 0 | 0–2147483647 |
| `requestTimeoutMillis` | 30000 | 1000–300000 |
| `downloadConnectTimeoutMillis` | 30000 | 1000–300000 |
| `downloadIdleTimeoutMillis` | 30000 | 1000–3600000 |
| `downloadTimeoutMillis` | 600000 | 1000–86400000 |
| `webSocketHandshakeTimeoutMillis` | 30000 | 1000–300000 |
| `heartbeatIntervalSeconds` | 20 | 5–300 |
| `heartbeatTimeoutSeconds` | 60 | 10–900 |
| `reconnectMinDelayMillis` | 1000 | 100–60000 |
| `reconnectMaxDelayMillis` | 30000 | 1000–300000 |
| `reconnectJitterPercent` | 20 | 0–50 |
| `ackTimeoutMillis` | 15000 | 1000–300000 |
| `nativeSubmissionTimeoutMillis` | 120000 | 1000–86400000 |

Bytes are exact integers; 100 MiB PDF and 20 MiB ZPL are recommendations, not
immutable content limits. `maxDownloadBytesPerSecond:0` explicitly means
unlimited aggregate download bandwidth. Jitter is applied within the configured
minimum/maximum reconnect bounds, including at the cap. No setting authorizes
an arbitrary URL, OS operation or widening of a user's permissions.

Validate these relationships before committing or applying policy:

- `maxQueuedFrameBytes >= maxFrameBytes`.
- `maxStagedBytes >= max(maxPdfBytes, maxZplBytes)`.
- `downloadTimeoutMillis >= downloadConnectTimeoutMillis` and
  `downloadTimeoutMillis >= downloadIdleTimeoutMillis`.
- `heartbeatTimeoutSeconds >= 2 * heartbeatIntervalSeconds`.
- `reconnectMaxDelayMillis >= reconnectMinDelayMillis`.
- Each corresponding setting is at most the declared client ceiling.

HELLO `limits` declares the client's actual supported maxima for
`maxCopies`, `maxPdfBytes`, `maxZplBytes`, `maxFrameBytes`, `maxQueuedFrames`,
`maxQueuedFrameBytes`, `maxConcurrentDownloads`, `maxConcurrentPrints`,
and `maxStagedBytes`. It is not a client request to lower server policy.
Reject incompatible policy with CONFIGURATION_REQUIRED; never silently clamp or
use a lower intersection. Concurrency must be an actual configurable bounded
pool, with separate per-printer serialization, not a permanently serial
implementation advertising a configurable pool.

A committed policy revision is pushed as SETTINGS. Apply and durably acknowledge
it before new work under that revision. Existing transfers retain their admitted
resource reservation and a consistent timeout/size snapshot; reducing limits
blocks further admission until usage fits, rather than discarding receipts or
reclassifying already submitted output. Queue/frame limits apply to both count
and bytes. Reserve capacity for acknowledgments/liveness; coalesce replaceable
state/settings/job notifications, but never drop durable events or receipts.
An overfull queue produces bounded backpressure/reconnect and durable replay.

Existing admission and retention policies keep their established names and
scopes; do not duplicate them as per-device transport defaults. Host/tenant
admission comprises `deviceOutstandingJobs`, `tenantOutstandingJobs`,
`deviceOutstandingBytes`, `tenantOutstandingBytes`, `deviceRetainedBytes`,
`tenantRetainedBytes`, `deviceJobsPerHour`, `tenantJobsPerHour`,
`devicePrinters` and `tenantPrinters`. Retention uses `enabled`, `days` and
`batchSize`. Their effective values and scope belong in authorized settings
metadata. Intrinsic protocol, renderer, pipe and operating-system ceilings must
be disclosed separately from editable operational policy. No implementation
may claim that this realtime settings object alone exposes every existing host
or Windows setting.

## Document transfer and failure boundaries

Large documents never enter WebSocket messages, JSON/base64 control buffers or
whole-file memory buffers. Stream the existing same-origin HTTPS content route
to a restricted temporary file with incremental SHA-256, actual byte counting,
format validation and a staging reservation. Validate declared length and format
against the effective PDF/ZPL policy before transfer; enforce actual bytes while
streaming, including absent or false Content-Length and decompression behavior.
Only verified complete content may be submitted to Windows.

Enforce configured connect, idle and total deadlines and aggregate bandwidth
across the bounded download pool. Dispose/cancel streams and remove only owned
temporary files on failure, retaining job identity/outcome evidence. A throttled
download must not consume the control reader, writer or command worker. Do not
start another download without its byte reservation or release reserved space
while a renderer still uses the file. No automatic retry may duplicate a
possibly submitted print.

Apply `nativeSubmissionTimeoutMillis` to the isolated native printer submission
using the admitted job's policy snapshot. A timeout does not prove that Windows
accepted no bytes; preserve uncertain output and never automatically submit it
again. A larger configured document limit must not leave a hidden fixed native
submission deadline in the consumer.

Authentication/permission failure blocks new work and preserves journal state.
A generic denial is not proof that the device was revoked. Protocol errors,
oversized messages and overload must fail explicitly; never treat them as an
empty queue. Close/reconnect transport without silently switching authentication.
Native HTTP calls continue to revalidate current user and device authority.

## Required consumer acceptance

Schema/fixture checks establish spelling, bounds and examples, not runtime or
hardware qualification. Both implementations must demonstrate these behaviors
with isolated real transports before release:

| Scenario | Required observation |
| --- | --- |
| Slow large PDF | Hold an HTTPS response mid-body; receive/apply a new desired-state revision and complete an unrelated owned command/receipt ACK before releasing the body. Liveness continues; resident memory does not scale with document length. |
| Concurrent transfers | Set download/print concurrency above one; observe bounded actual parallel transfers, aggregate bandwidth/staging limits and per-printer serialization. Restore the configured default of one without dropping admitted work. |
| Lost command receipt ACK | Commit receipt, drop ACK, reconnect and replay exact envelope; one native cancellation invocation, one durable result, replay ACK succeeds. |
| Interrupted cancellation | Lose the connection/process after durable execution intent but before a known result; preserve OUTCOME_UNKNOWN and do not issue the native operation twice. |
| Queued work while offline | Commit jobs and controls while the socket is absent; reconnect snapshot/pending-command replay and one job wake drain all eligible queued work without a timer or duplicate print. |
| Empty-claim/enqueue race | Enqueue after the last empty query while ending a drain; a committed wake is retained and the new job is claimed without polling. |
| Lost claim response | Disconnect after server claim commit; reconcile assigned work and the journal before further claims, without stranding or reprinting it. |
| Lost event ACK | Commit SPOOLED then drop ACK; the identical replay fixture is acknowledged without another spool submission. |
| Policy change | Push validated new settings during a stalled transfer; control remains responsive, new claims wait for both revisions, and existing reservations remain bounded. |
| Policy/ceiling refusal | Reject missing/fractional/out-of-range/cross-field-invalid values and a policy above declared client capability; no silent defaults or clamping. |
| Authorization loss | Revoke session/device or withdraw current permission while idle and busy; reject further delivery/claims, preserve pending evidence and never use bearer fallback. |
| Connection replacement | Replace a socket, then deliver old-generation ACK/close callbacks; replacement ownership and pending messages remain correct. |
| Inventory/frame bounds | Exercise the maximum configured inventory and fragmented/oversized control messages; fail explicitly before unbounded allocation, never interpret partial inventory as withdrawal. |
| Notification source | Demonstrate after-commit enqueue/control/settings wake-ups and reconnect reconciliation with no periodic HTTP or database job/control polling. |

Physical output still requires user/hardware confirmation. SPOOLED and
SPOOLER_COMPLETED retain their existing meanings.
