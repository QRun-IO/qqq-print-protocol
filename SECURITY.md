# Security

This repository specifies the QQQ printing wire boundary. Implementations must authenticate every device operation, bind jobs and content to the enrolled device, restrict administration separately, and avoid automatically reprinting uncertain submissions.

Report vulnerabilities privately using [GitHub private vulnerability reporting](https://github.com/QRun-IO/qqq-print-protocol/security/advisories/new). If that channel is unavailable, contact `contact@kingsrook.com`. Do not publish working device tokens, enrollment codes, customer print content or exploit details in a public issue.

Fixes target the current prerelease and protocol v1 consumers; there is no separate legacy support branch. TLS, token storage, host permissions and printer-command restrictions are implemented and assessed in the server and Windows repositories.
