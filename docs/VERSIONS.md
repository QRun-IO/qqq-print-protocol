# Extension version registry

Three version numbers are independent. Do not compare them.

| Number | Meaning | Current |
| --- | --- | --- |
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
| 2.3.0 (unreleased, reserved) | Least-privilege operator catalog, submission and request lookup; reported queue-default media and `printer-media-v1`; opt-in retained-source facade | [PRINTER-MEDIA.md](PRINTER-MEDIA.md) |

## Negotiation rules

- A client advertises a capability only when it supports it **and** the discovered
  extension is a stable `major.minor.patch` version in major 2 at or above the
  feature minimum. `printer-media-v1` has minimum 2.3.0.
- A client facing 2.0, 2.1 or 2.2 stays a three-capability peer (`realtime-v1`,
  `REFRESH_INVENTORY`, `CANCEL_SPOOL`) and sends no media inventory.
- A server must not let a client that did not advertise `printer-media-v1` claim a
  job that carries a media selection, whatever extension version that client
  discovered.
- Capabilities are re-evaluated on each new socket, so a server upgrade from 2.0
  to 2.3, or a downgrade from 2.3 to 2.2, takes effect at the next reconnect
  without a polling schedule.
- Pre-release, ambiguous or malformed versions (`2.3.0-rc.1`, `2.3`, `02.3.0`,
  four-part values) never enable a feature.

The 2.3.0 number is reserved for the unreleased operator, media and retained-source
feature set. It is not a published release until consumer artifacts are qualified
together.
