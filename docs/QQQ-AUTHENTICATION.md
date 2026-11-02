# Standard QQQ authentication

The new Windows client uses the QQQ semantic UI/UX API. Package versions, wire
payload version `1` and the printing extension semantic version are separate
contracts. The standard-session contract was published in `0.2.0-rc.1`; realtime
transport is part of release candidate `0.3.0-rc.1`. This document does not establish an
accepted Authentik deployment.

## Discovery and sign-in

Require printing extension `>=2.0.0 <3.0.0` before opening the realtime channel
or dispatching work. Standard discovery and sign-in may accept compatible 1.x
and 2.x extensions; a successful 1.x login does not permit realtime dispatch or
polling fallback. Published 0.2 clients used native printing extension 1.0 and
cannot satisfy the new mandatory channel prerequisite. The standard descriptor
is unchanged; `realtime-v1` is mandatory in WebSocket HELLO. See
[realtime authentication and transport](REALTIME.md).

Read public `/qqq/v1/version` before sending credentials. Require core semantic
API version `>=1.8.0 <2.0.0`, the `api` channel and printing extension version
`>=1.0.0 <3.0.0` for the shared authentication client. Realtime operation still
requires the stricter 2.x gate above.
Use client channel `api/qqq-print-agent` and read
`/qqq/v1/metaData/authentication`. Do not infer server authentication from a URL,
brand, a saved token or a previous deployment.

For `TABLE_BASED` authentication, sign in through standard `manageSession` with
the supplied credentials. Retain the QQQ session cookie, never the password.
For OAuth2, additionally require core API `>=1.9.0 <2.0.0`, the shared QQQ
`nativeSessionLogin` capability and its typed `AUTHORIZATION_CODE_PKCE_SESSION`
grant, S256, `prompt: "login"` and exact allowed redirect URI.
Use the system browser, random state and PKCE, then exchange the authorization
code through standard `manageSession`. Do not put a confidential OAuth client
secret in Windows, substitute a public bearer client or invent a refresh API.
Missing native grants require server configuration, not a fallback local login.

The desktop callback must match the shared grant and installer registration.
Windows uses the exact private callback
`io.qrun.qqq-print-agent:/oauth/callback`; current central candidate policy rejects
HTTP callbacks. The installer registers the callback to a non-elevated forwarding
helper, which delivers it only to an active sign-in attempt in the same Windows
user/session. State and PKCE validation remain mandatory. The implementation,
shared grant and provider deployment must be qualified before Authentik acceptance.

## User and device authority

Protected printing routes are under `/qqq/v1/qbit/printing`. Every request needs
the current QQQ session. Agent operations additionally send
`X-QQQ-Device-Id` and `X-QQQ-Device-Token` only to the configured printing origin.
Never forward these credentials to discovery, public assets or another origin.

Enrollment at `/devices/enroll` validates the facility against the current
user's allowed facilities and binds the new device to that authoritative QQQ
principal. An existing unbound device uses explicit `/device/bind` with its
device proof and a currently authorized session. `/session` returns authoritative
`principalId` and `tenantId`; it includes `deviceId` only when the request also
supplies validated secondary proof for that bound device. Client display names are not
identity. A conflicting binding fails rather than silently transferring a device.

Each subsequent agent request checks the bound principal, tenant and current
record/process permissions. Administrative controls instead authorize the current
administrator against the target device and affected jobs; administrators do not
need another device's secret or have to impersonate its enrolled user. Generic
table writes stay disabled. Domain operations perform their own permission and
concurrency checks.

## Unattended service sessions

The service protects its session using Windows DPAPI and restricts access through
the existing authenticated local service channel. Snapshots and logs must not
contain cookies, passwords, device secrets or authorization codes. A token refresh
must not discard the device journal or permit a completed job to print again.

Resume through standard `manageSession` within the server cookie lifetime.
OAuth provider refresh tokens remain encrypted on the QQQ server. Months or years
of operation depend on server and provider renewal policy; no client credential
guarantees indefinite login. Account disablement, permission changes, logout,
session expiry and device revocation must remain effective. Fresh permission
invalidation must be qualified against the shared core, not assumed from a cached
session. Authorization failure blocks new printing while preserving journals and
uncertain outcomes for explicit recovery.

Legacy `/printing/v1` bearer transport remains explicit compatibility for old
integrations. It is not the new client's primary security boundary, and failure
of native discovery or authentication never silently activates it.

Once a device is bound to a QQQ principal, its token must be rejected by legacy
device routes. The same secondary proof cannot be used to bypass user permissions
through an older endpoint. Existing unbound devices may remain eligible for an
explicit migration policy until they are associated with an account.

Native hosts disable legacy enrollment by default: an enrollment code cannot
create a bearer-only identity through the old route. Legacy-only hosts may
explicitly enable that separate compatibility flow. Native enrollment continues
to require the current QQQ user, facility permissions and atomic account binding.
