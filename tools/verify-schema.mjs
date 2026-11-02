// Copyright 2026 Kingsrook, LLC
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { fixtureTypes } from './fixture-types.mjs';
import './verify-realtime.mjs';

const schema = JSON.parse(readFileSync(new URL('../schemas/protocol.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv2020({ strict: true, allErrors: true });
addFormats(ajv);
assert(ajv.validateSchema(schema), ajv.errorsText());
ajv.addSchema(schema);

// Compile every DTO, including ones without a dedicated example, so broken references fail CI.
for(const name of Object.keys(schema.$defs))
{
   ajv.compile({ $ref: `${schema.$id}#/$defs/${name}` });
}
for(const [file, type] of Object.entries(fixtureTypes))
{
   const value = JSON.parse(readFileSync(new URL(`../fixtures/${file}`, import.meta.url), 'utf8'));
   const validate = ajv.compile({ $ref: `${schema.$id}#/$defs/${type}` });
   assert(validate(value), `${file}: ${ajv.errorsText(validate.errors)}`);
}
const validateTest = ajv.compile({ $ref: `${schema.$id}#/$defs/DeviceTestPrintRequest` });
const testRequest = { printerId: 'printer-zebra', format: 'ZPL', requestId: 'test-1' };
assert(validateTest(testRequest), 'Existing requests without a profile remain valid.');
assert(validateTest({ ...testRequest, testProfile: 'LABEL_4X6_300' }));
assert(!validateTest({ ...testRequest, testProfile: 'LETTER' }));
assert(!validateTest({ ...testRequest, testProfile: null }));
assert(!validateTest({ format: 'PDF' }));
const validatePrinters = ajv.compile({ $ref: `${schema.$id}#/$defs/PrinterList` });
const printerPage = JSON.parse(readFileSync(new URL('../fixtures/printers-page.response.json', import.meta.url), 'utf8'));
assert(validatePrinters(printerPage));
assert(validatePrinters({ printers: printerPage.printers }), 'Older responses without a cursor remain valid.');
assert(validatePrinters({ ...printerPage, nextCursor: 'opaque-server-cursor' }));
assert(!validatePrinters({ ...printerPage, nextCursor: 17 }));
assert(!validatePrinters({ ...printerPage, nextCursor: 'x'.repeat(12001) }));
assert(!validatePrinters({ printers: Array(201).fill(printerPage.printers[0]) }));
const control = name => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8'));
const validControl = (type, value) => ajv.validate(`${schema.$id}#/$defs/${type}`, value);
assert(!validControl('PrintingSessionIdentity', { tenantId: 'test-tenant' }), 'Display or device identity cannot replace the authoritative principal.');
assert(!validControl('PrintingSessionIdentity', { principalId: 'test-operator', tenantId: '' }));
assert(!validControl('PrintingSessionIdentity', { principalId: 'test-operator', tenantId: 'test-tenant', deviceId: null }));
assert(validControl('PrintingSessionIdentity', { principalId: 'test-operator', tenantId: 'test-tenant', futureResponseField: true }));
const action = control('action-clear-queue.request.json');
assert(validControl('AdminDeviceActionRequest', action));
const withoutIssuedAt = { ...action };
delete withoutIssuedAt.issuedAt;
assert(!validControl('AdminDeviceActionRequest', withoutIssuedAt), 'New controls require their durable freshness timestamp.');
for(const invalid of [
   { issuedAt: '2026-10-31T16:00:00-05:00' },
   { issuedAt: null },
   { action: 'RESTART_SERVICE' },
   { action: 'CANCEL_SPOOL' },
   { jobId: 'job-example-1' },
   { spoolerJobId: '17' },
   { queueName: 'Some other queue' },
   { command: 'shell' },
   { requestId: '../device' }
])
{
   assert(!validControl('AdminDeviceActionRequest', { ...action, ...invalid }), JSON.stringify(invalid));
}
const poll = control('control-poll.request.json');
assert(!validControl('DeviceControlPollRequest', { ...poll, controlVersion: 2 }));
assert(!validControl('DeviceControlPollRequest', { ...poll, capabilities: ['CANCEL_SPOOL', 'CANCEL_SPOOL'] }));
assert(!validControl('DeviceControlPollRequest', { ...poll, capabilities: ['RESTART_SERVICE'] }));
assert(!validControl('DeviceControlPollRequest', { ...poll, lastAppliedRevision: -1 }));
assert(!validControl('DeviceControlPollRequest', { ...poll, lastAppliedRevision: 9007199254740992 }));
const pollResult = control('control-poll.response.json');
assert(validControl('DeviceControlPollResponse', { ...pollResult, futureResponseField: true }), 'Additive response fields remain compatible.');
assert(!validControl('DeviceControlPollResponse', { ...pollResult, commands: Array(21).fill(pollResult.commands[0]) }));
assert(!validControl('DeviceControlPollResponse', { ...pollResult, desiredState: { ...pollResult.desiredState, connectionState: 'REVOKED' } }), 'Revocation is credential invalidation, not reversible desired state.');
assert(!validControl('DeviceCommand', { ...pollResult.commands[1], jobId: null }));
assert(!validControl('DeviceCommand', { ...pollResult.commands[0], jobId: 'job-example-1' }));
assert(!validControl('DeviceCommand', { ...pollResult.commands[0], action: 'CLEAR_QUEUE' }), 'Server queue clear is never an arbitrary client command.');
const receipt = control('control-cancel-requested.receipt.json');
assert(!validControl('DeviceCommandReceipt', { ...receipt, outcome: 'PRINT_RECALLED' }));
assert(!validControl('DeviceCommandReceipt', { ...receipt, message: 'x'.repeat(1025) }));
assert(!validControl('DeviceCommandReceipt', { ...receipt, completedAt: 'not-a-date' }));
assert(!validControl('DeviceCommandReceipt', { ...receipt, jobId: 'other-job' }), 'Receipt cannot override its route-bound command target.');
const history = control('control-commands-page.response.json');
assert(!validControl('DeviceActionList', { ...history, commands: Array(201).fill(history.commands[0]) }));
assert(!validControl('DeviceActionList', { ...history, nextCursor: 'x'.repeat(12001) }));
console.log(`Compiled ${Object.keys(schema.$defs).length} JSON Schema 2020-12 definitions; ${Object.keys(fixtureTypes).length} fixtures passed full schema validation.`);
