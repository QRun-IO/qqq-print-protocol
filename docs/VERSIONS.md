# Extension version registry

Distribution, native API, wire and subprotocol versions are independent. Do not
compare them as if they were one version sequence. See the [stable cohort](INTEGRATION.md#stable-printing-release).

| Number | Meaning | Current |
| --- | --- | --- |
| Protocol distribution | Version of the specification and fixture archive | 1.1.0 (unreleased; 1.0.0 published) |
| Wire payload version | Shape of the JSON messages in this repository | 1 |
| WebSocket subprotocol | Framing and message envelope | `qqq-printing.v1` |
| Printing semantic extension | Server feature level discovered at `/qqq/v1/version` | see below |

## Printing semantic extension

Extension versions are discovered, never assumed. Within major 2 each minor is
additive and keeps the earlier behavior.

| Extension | Adds | Contract |
| --- | --- | --- |
| 2.0.0 | Authenticated realtime channel is required for native claims; no polling fallback | [REALTIME.md](REALTIME.md) |
| 2.1.0 | Record, table-list and text print processes | server documentation |
| 2.2.0 | Render-to-PDF process, header and footer values, content sections. No media negotiation | server documentation |
| 2.3.0 | Least-privilege operator catalog, submission and request lookup; reported queue-default media and `printer-media-v1`; opt-in retained-source facade | [PRINTER-MEDIA.md](PRINTER-MEDIA.md) |
| 2.4.0 | `printer-approval-v1` and the server → client `PRINTERS` frame reporting each exposed printer's approval | [REALTIME.md](REALTIME.md#printer-approval) |

## Negotiation rules

- A client advertises a capability only when it supports it **and** the discovered
  extension is a stable `major.minor.patch` version in major 2 at or above the
  feature minimum. `printer-media-v1` has minimum 2.3.0; `printer-approval-v1`
  has minimum 2.4.0.
- A client facing 2.0, 2.1 or 2.2 stays a three-capability peer (`realtime-v1`,
  `REFRESH_INVENTORY`, `CANCEL_SPOOL`) and sends no media inventory. A client
  facing 2.3 is at most a four-capability peer and receives no `PRINTERS` frame.
- A server sends `PRINTERS` only on a connection whose HELLO advertised
  `printer-approval-v1`, whatever extension version it serves; a client that did
  not advertise it keeps its own approval fallback.
- A server must not let a client that did not advertise `printer-media-v1` claim a
  job that carries a media selection, whatever extension version that client
  discovered.
- Capabilities are re-evaluated on each new socket, so a server upgrade from 2.0
  to 2.4, or a downgrade from 2.4 to 2.2, takes effect at the next reconnect
  without a polling schedule.
- Pre-release, ambiguous or malformed versions (`2.3.0-rc.1`, `2.3`, `02.3.0`,
  four-part values) never enable a feature.

QBit 1.0.0 advertises native printing extension 2.3.0. Windows 1.0.1 is the paired
stable client; their product versions do not replace capability discovery.
QBit 1.1.0 advertises 2.4.0 and pairs with Windows 1.2.1; a 2.4.0 server still
serves 1.0.1/1.1.x clients as four-capability peers, and a 1.2.1 client facing
2.3.0 does not advertise `printer-approval-v1`.
