# TODO

- [ ] Verify security-gated artifact promotion and public build provenance for 0.1.4-rc.1.
- [x] Audit PR #2 at 2e871e6 passes all hosted checks; verify downloaded CI archive checksum. Tagged release and published attestation remain pending.
- [x] Shared contract v1 remains unchanged during the retention/storage and Windows audit fixes.
- [x] User confirmed laser PDF and Zebra ZPL/PDF output with the previous implementation releases; barcode scanning remains unverified.

- [x] Run `npm run check` for the additive profile and history-pagination extension:28 definitions,21 fixtures passed.
- [x] Both downstream fixture pins use a0de93b; remote CI41126317410 passed.

- [x] Freeze v1 endpoints and cross-language DTO names.
- [x] Create JSON schema and enrollment/inventory/job/event fixtures.
- [x] Verify sample content integrity and fixture structure.
- [x] Consume shared fixtures in Java HTTP tests.
- [x] Consume shared fixtures in .NET tests.
- [x] Verify live local server/connector round trip and user-confirmed real laser output, including installed LocalSystem service.
- [ ] Verify Zebra hardware when available.
- [x] Add public repository documentation, license, schema validation CI and release archive tooling.
- [ ] Verify GitHub CI after maintainer publication.

WebSocket notifications, automatic reconciliation, cancellation, destination CRUD and fleet-scale behavior are outside this initial wire contract.

- [ ] Complete independent review and deployment qualification after the five baseline security findings are remediated; current details are in SESSION-STATE.md.
