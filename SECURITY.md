# Security

This repository specifies the QQQ printing wire boundary. Implementations must authenticate every device operation, bind jobs and content to the enrolled device, restrict administration separately, and avoid automatically reprinting uncertain submissions.

Report vulnerabilities privately using [GitHub private vulnerability reporting](https://github.com/QRun-IO/qqq-print-protocol/security/advisories/new). If that channel is unavailable, contact `contact@kingsrook.com`. This private reporting channel remains available while [Gitea](https://git.kof22.com/QRun-IO/qqq-print-protocol) is primary for source, pull requests and releases. Do not publish working device tokens, enrollment codes, customer print content or exploit details in a public issue on either forge.

Fixes target stable protocol 1.0.0 and supported wire-v1 consumers; there is no separate legacy support branch. TLS, token storage, host permissions and printer-command restrictions are implemented and assessed in the [server](https://git.kof22.com/QRun-IO/qbit-printing) and [Windows](https://git.kof22.com/QRun-IO/qqq-print-agent) repositories. Native printing requires the current QQQ user session plus secondary device proof; a transport failure never permits an authentication or polling fallback.
