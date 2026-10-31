# Device controls — additive wire v1

This extension provides server dispatch controls and two bounded Windows agent
commands. Its additive payloads preserve existing print job states and old
request bodies. Package version `0.2.0-rc.1` is the proposed coordinated release;
this document does not claim publication, deployment, or production readiness.

## Discovery and routes

The primary transport is the discovered QQQ semantic extension at
`/qqq/v1/qbit/printing`, extension version `1.0.0`, using channel
`api/qqq-print-agent`. Standard QQQ session authentication and current user,
tenant, table, process and record permissions apply. Device calls additionally
send `X-QQQ-Device-Id` and `X-QQQ-Device-Token`; that secondary proof does not
replace the user session. See [QQQ authentication](QQQ-AUTHENTICATION.md).

Paths below are relative to that primary base, except `/version`, which describes
legacy wire discovery. Primary discovery uses `/qqq/v1/version` and its printing
extension advertisement. Compatibility transport retains `/printing/v1` with
host-authorized administrator scope and device bearer credentials. Compatibility
is explicit and is never a silent fallback for a missing or denied native route.
Neither request bodies nor cursor contents grant authority.

Legacy device-token authentication is valid only for eligible unbound migration
identities. Account-bound devices must use native user sessions; a bound token
alone is denied even when the legacy endpoint remains registered. Native hosts
disable legacy enrollment unless a legacy-only deployment explicitly enables it.

| Method and path | Request | Response |
| --- | --- | --- |
| GET `/version` | None | `ProtocolVersionResponse` |
| POST `/device/control/poll` | `DeviceControlPollRequest` | `DeviceControlPollResponse` |
| POST `/device/control/commands/{commandId}/receipt` | `DeviceCommandReceipt` | `Acknowledgment` |
| POST `/admin/devices/{deviceId}/actions` | `AdminDeviceActionRequest` | `DeviceActionRecord` |
| GET `/admin/devices/{deviceId}/commands` | Optional `limit`, `before` | `DeviceActionList` |
| GET `/admin/devices/{deviceId}/commands/{commandId}` | None | `DeviceActionRecord` |

All successful responses use HTTP 200. Version discovery adds optional
`capabilities:["device-control-v1"]`; `protocolVersion` remains integer `1`.
For explicit compatibility transport, an older version response without that capability establishes only
legacy support. A first poll returning 404 can establish legacy absence when the
server did not advertise the capability. A timeout, 401/403, 5xx, or malformed
response cannot establish legacy support. After control support is established,
a missing capability or 404 is a failure, never permission to bypass saved state.
Native printing extension `1.0.0` includes these controls; a native-route 404 is
always a configuration or compatibility failure, never legacy discovery.

The new poll reports `controlVersion:1`, `agentVersion`, `capabilities`, and
`lastAppliedRevision`. The two capability names are `REFRESH_INVENTORY` and
`CANCEL_SPOOL`; an empty list is valid for a state-only agent. A successful poll
establishes state-control support independently of these command capabilities.
An admin remote command unsupported by the last negotiated capabilities returns
409 `CONTROL_UNSUPPORTED`. A capable but offline device may have a pending
command; acceptance does not establish delivery or execution.

The optional management `Device.control` contains `supported`, `capabilities`,
optional `lastPollAt`, `lastAppliedRevision`, and `desiredState`. Missing control
metadata means support is unknown. `lastPollAt` and the observed revision must be
shown separately from the desired state; neither software version nor a saved
capability proves that an offline agent applied a new setting.

## Desired state and ongoing work

`desiredState` contains `revision`, `dispatchPaused`, and `connectionState`, whose
values are `CONNECTED` and `DISCONNECTED`. Initial state is revision 0, false,
and `CONNECTED`. Changes are committed atomically with their action record and
advance the revision. Revisions are nonnegative JSON-safe integers, at most
9007199254740991. A device reports a revision only after applying and durably
retaining that state; it cannot acknowledge a future server revision. The agent
must not replace newer persisted state with an older poll response.

The control loop runs independently of printing. Pausing or disconnecting gates
new claims and dispatch. It does not cancel CLAIMED or later work, erase local
journals, withdraw exposure selections, or discard in-flight job events. Claims
and server state changes are serialized so work claimed before the change remains
in flight. Before first synchronization or after restart, the agent retains the
last state and withholds new claims until valid state or explicit legacy support
has been established.

`DISCONNECTED` stops ordinary heartbeat, inventory publication, and new claims.
Authenticated control polling, command receipts, and in-flight job events remain
available, so `RECONNECT` can reach the device. `REFRESH_INVENTORY` waits for
`CONNECTED` or expires; it must not report success without publishing inventory.
Explicit `CANCEL_SPOOL` remains available over the control path while disconnected.
Reconnecting does not clear `dispatchPaused`; resuming does not change connection
state. These are independent controls.

Revocation invalidates the old credential permanently and blocks device routes,
including control polling. Resume and reconnect cannot restore it. Re-enrollment
uses the separate existing enrollment flow and a new local connection scope.
401/403 blocks ordinary traffic and requires authorization recovery; a generic
authentication failure is not proof of revocation. Keep the journal and receipts,
report authorization required, and do not automatically re-enroll or erase state.

## Administrator actions and replay

`AdminDeviceActionRequest` requires `requestId`, `issuedAt` (RFC 3339 UTC ending
in `Z`), and `action`. Only `CANCEL_SPOOL` accepts and requires `jobId`. No action
accepts a queue name, numeric spool ID, executable, shell text, service name, or
operating-system command. Unknown action names and request fields are rejected.

| Action | Authoritative effect |
| --- | --- |
| `PAUSE_DISPATCH` | Set desired `dispatchPaused:true` and block new server claims. |
| `RESUME_DISPATCH` | Set desired `dispatchPaused:false`; preserve connection and revocation state. |
| `DISCONNECT` | Set desired `connectionState:DISCONNECTED` and block new server claims. |
| `RECONNECT` | Set desired `connectionState:CONNECTED`; preserve dispatch pause and revocation state. |
| `REVOKE` | Permanently invalidate the old credential. |
| `CLEAR_QUEUE` | Atomically cancel only currently QUEUED jobs for this device. |
| `REFRESH_INVENTORY` | Queue an agent command to discover and publish its locally exposed queues. |
| `CANCEL_SPOOL` | Queue a cancellation request for the exact owned job identified by `jobId`. |

The first five actions and queue clear complete on the server. Their record has
`status:SUCCEEDED` and result code `DESIRED_STATE_UPDATED`, `CREDENTIAL_REVOKED`,
or `QUEUED_JOBS_CANCELLED`, respectively. These results do not assert remote
execution. Queue clear also returns `cancelledJobCount`. It preserves history,
records cancellation using the existing FAILED job status, and never modifies a
CLAIMED or later job. Replaying its action must not cancel jobs queued afterward.

Scope request IDs to the authorized tenant and device. Look up the existing
request before checking its age. Identical input, including `issuedAt`, returns
the original record without another effect. Reusing that ID with changed input
returns 409. Commit the action record and its server effect or pending command
atomically before success. A transport retry retains the entire request body.

For an absent request ID, `issuedAt` must be no more than 15 minutes old and no
more than 60 seconds in the future, using server time. A stale request returns
410; a future timestamp outside the allowance is invalid (400). Never refresh
`issuedAt` automatically after a timeout or stale response. A newly reviewed
action requires a new request ID and timestamp. IDs are never intentionally
reused. Existing exact requests continue to replay within retained history even
after their timestamp has aged out of the new-request window.

At most 100 commands may remain pending per device. Retained action metadata is
bounded to 1000 records per device, with one reserved revocation record so
capacity cannot prevent credential revocation. Reclaim eligible terminal history
before rejecting new work with 429. Terminal history may be removed after seven
days measured from server-recorded termination; preserve unexpired or unfinished
records. Old unchanged requests still fail the timestamp check after pruning and
therefore cannot execute again. These limits affect control metadata, not job
history or document retention.

## Command delivery and receipts

Remote actions initially return `PENDING`. `DeviceCommand` carries stable
`commandId`, `requestId`, `action`, `createdAt`, `expiresAt`, and, for spool cancel,
`jobId`. Server-created expiry is 15 minutes after creation. One poll returns at
most 20 commands and `serverTime`, `pollIntervalSeconds` (1–300), and the full
desired state. Pending commands may be delivered repeatedly until a receipt or
expiry; they are not new commands on every poll. Do not deliver expired commands.

The agent journals command identity and execution state before a side effect.
Use the current enrollment/connection scope. It checks expiry before beginning,
with server time available to avoid silently trusting a skewed local clock.
A completed command returns its original stored receipt on duplicate delivery.
After an interrupted cancellation whose outcome is uncertain, persist and report
`OUTCOME_UNKNOWN`; never run the cancellation again speculatively. Receipt
retransmission has no printing or cancellation side effect.

`DeviceCommandReceipt` requires stable `receiptId`, `outcome`, and `completedAt`;
optional `message` is at most 1024 characters. Persist the full receipt before
transport. Exact replay returns `{ "accepted": true }`; a conflicting terminal
receipt returns 409. The command ID in the route is the authority binding; receipts
for another device's command are refused without disclosing it. The server
validates that an outcome is meaningful for the original command.

| Outcome | Permitted command | Record status |
| --- | --- | --- |
| `INVENTORY_REFRESHED` | `REFRESH_INVENTORY` | `SUCCEEDED` |
| `CANCEL_REQUESTED` | `CANCEL_SPOOL` | `SUCCEEDED` |
| `ALREADY_ABSENT` | `CANCEL_SPOOL` | `SUCCEEDED` |
| `OWNERSHIP_MISMATCH` | `CANCEL_SPOOL` | `FAILED` |
| `UNSUPPORTED`, `FAILED` | Either | `FAILED` |
| `EXPIRED` | Either | `EXPIRED` |
| `OUTCOME_UNKNOWN` | Either | `OUTCOME_UNKNOWN` |

An expired server record without a receipt means the deadline passed without
confirmation; it does not prove that no side effect occurred. Accept the first
valid late receipt and replace this provisional EXPIRED status with its actual
outcome. Once a receipt exists it is immutable. A late receipt never authorizes
redelivery or re-execution. History responses include the receipt when present.

After `expiresAt` plus seven days, a 404 from this specific command's receipt
endpoint can mean the server pruned its record. The agent may stop retransmitting
that receipt, retaining its exact local outcome as transport-retired rather than
server-acknowledged. This must not block newer commands or cause re-execution.
A 404 before that bound, or from control polling, does not establish this case.

Cancellation resolves the job from the agent's current connection journal and
checks the exact printer, spool reference, and owned document identity before
using Windows cancellation. Numeric spool IDs may be reused. Missing ownership
proof must refuse cancellation, not fall back to a queue-wide operation. Report
`ALREADY_ABSENT` only when the exact owned job is known and its spool entry is
absent. An identity mismatch reports `OWNERSHIP_MISMATCH` without cancellation.
`CANCEL_REQUESTED` means Windows accepted the request; it does not guarantee that
paper, a label, or data already sent to hardware was recalled. Job event history
remains intact; command outcomes do not fabricate physical print completion.

## History, fixtures, and verification scope

The command list includes server actions and remote commands, newest first.
`limit` defaults to 50 and ranges from 1 to 200. `nextCursor` is null at the end;
otherwise pass the bounded opaque cursor unchanged as `before`. Both list and
detail routes enforce tenant and device scope. Responses contain control metadata
and receipts, never credentials or document bytes.

The JSON Schema defines all new messages. Synthetic fixtures cover all eight
actions, both command types, disconnected polling, server-only results, every
receipt outcome, bounded history, and legacy version discovery. `npm run check`
checks structural constraints and representative invalid inputs. Atomicity,
authorization, time-window enforcement, expiry races, crash recovery, and Windows
ownership checks additionally require the server and agent integration suites;
schema validation alone does not prove those behaviors.
