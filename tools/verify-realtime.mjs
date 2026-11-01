// Copyright 2026 Kingsrook, LLC
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const schema = JSON.parse(readFileSync(new URL('../schemas/protocol.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv2020({ strict: true, allErrors: true });
addFormats(ajv);
ajv.addSchema(schema);
const fixture = name => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8'));
const valid = (type, value) => ajv.validate(`${schema.$id}#/$defs/${type}`, value);
const settings = fixture('realtime-settings.payload.json');
const hello = fixture('realtime-hello.message.json');
const extension = fixture('printing-realtime-extension.discovery.json');
assert(valid('PrintingRealtimeExtensionDiscovery', extension), ajv.errorsText());
assert.equal(extension.version, '2.0.0');
assert(valid('PrintingRealtimeExtensionDiscovery', { ...extension, version: '2.7.3' }));
for(const version of ['1.0.0', '1.1.0', '3.0.0', '2.0', '2.01.0', '2.0.0-rc.1', null])
{
   assert(!valid('PrintingRealtimeExtensionDiscovery', { ...extension, version }), 'Only the compatible stable native major is accepted.');
}
assert(!valid('PrintingRealtimeExtensionDiscovery', { ...extension, name: 'another-extension' }));
assert(!valid('PrintingRealtimeExtensionDiscovery', { ...extension, pathPrefix: '/printing/v1' }));

/*******************************************************************************
 ** Cross-field policy relationships require semantic checks beyond JSON Schema.
 *******************************************************************************/
function assertPolicy(policy, limits)
{
   assert(valid('RealtimeSettings', policy), ajv.errorsText());
   assert(valid('RealtimeClientLimits', limits), ajv.errorsText());
   assert(policy.maxQueuedFrameBytes >= policy.maxFrameBytes, 'Frame queue must hold one permitted message.');
   assert(policy.maxStagedBytes >= Math.max(policy.maxPdfBytes, policy.maxZplBytes), 'Staging must admit one permitted document.');
   assert(policy.downloadTimeoutMillis >= policy.downloadConnectTimeoutMillis);
   assert(policy.downloadTimeoutMillis >= policy.downloadIdleTimeoutMillis);
   assert(policy.heartbeatTimeoutSeconds >= 2 * policy.heartbeatIntervalSeconds);
   assert(policy.reconnectMaxDelayMillis >= policy.reconnectMinDelayMillis);
   for(const name of schema.$defs.RealtimeClientLimits.required)
   {
      assert(policy[name] <= limits[name], `${name}: policy exceeds declared client capability`);
   }
}

assertPolicy(settings, hello.payload.limits);
assert.equal(settings.maxConcurrentDownloads, 1, 'Initial deployment defaults to one configurable download lane.');
assert.equal(settings.maxCopies, 100);
assert.equal(settings.nativeSubmissionTimeoutMillis, 120000);
for(const [name, rule] of Object.entries(schema.$defs.RealtimeSettings.properties))
{
   if(rule.default !== undefined) assert.equal(settings[name], rule.default, `${name}: fixture/schema default mismatch`);
   const missing = { ...settings };
   delete missing[name];
   assert(!valid('RealtimeSettings', missing), `${name}: missing value cannot inherit a default`);
   for(const value of [rule.minimum - 1, rule.maximum + 1, 1.5, null])
   {
      assert(!valid('RealtimeSettings', { ...settings, [name]: value }), `${name}: invalid bound/type accepted`);
   }
}
for(const change of [
   { maxQueuedFrameBytes: 8192 },
   { maxStagedBytes: 1 },
   { downloadTimeoutMillis: 1000 },
   { heartbeatTimeoutSeconds: 10 },
   { reconnectMinDelayMillis: 60000, reconnectMaxDelayMillis: 1000 }
])
{
   assert.throws(() => assertPolicy({ ...settings, ...change }, hello.payload.limits));
}
for(const name of schema.$defs.RealtimeClientLimits.required)
{
   assert.throws(() => assertPolicy(settings, { ...hello.payload.limits, [name]: settings[name] - 1 }), name);
}
assertPolicy({ ...settings, maxConcurrentDownloads: 16, maxConcurrentPrints: 16, maxCopies: 32767 }, hello.payload.limits);
assert(!valid('RealtimeHello', { ...hello, payload: { ...hello.payload, capabilities: [] } }));
assert(!valid('RealtimeHello', { ...hello, payload: { ...hello.payload, capabilities: ['CANCEL_SPOOL'] } }));
assert(!valid('RealtimeHello', { ...hello, payload: { ...hello.payload, limits: {} } }));
assert(!valid('RealtimeHello', { ...hello, messageId: 'hello:unsafe-prefix' }));
assert(!valid('RealtimeHello', { ...hello, token: 'not-a-real-token' }));
assert(!valid('RealtimeClientMessage', { type: 'RUN_SHELL', messageId: 'unsupported-1', payload: {} }));

const clientFixtures = ['hello', 'state-applied', 'job-event', 'command-receipt', 'heartbeat', 'inventory', 'ping'];
const serverFixtures = ['welcome', 'desired-state', 'job-available', 'command', 'settings', 'ack', 'error', 'pong'];
for(const [files, accepted, rejected] of [
   [clientFixtures, 'RealtimeClientMessage', 'RealtimeServerMessage'],
   [serverFixtures, 'RealtimeServerMessage', 'RealtimeClientMessage']
])
{
   for(const name of files)
   {
      const message = fixture(`realtime-${name}.message.json`);
      assert(valid(accepted, message), `${name}: ${ajv.errorsText()}`);
      assert(!valid(rejected, message), `${name}: wrong-direction frame accepted`);
      assert(Buffer.byteLength(JSON.stringify(message), 'utf8') <= settings.maxFrameBytes);
      const missing = { ...message };
      delete missing.payload;
      assert(!valid(accepted, missing), `${name}: missing payload accepted`);
      assert(!valid(accepted, { ...message, contentUrl: 'https://unrelated.invalid/document' }));
   }
}
const event = fixture('realtime-job-event.message.json');
assert.deepEqual(fixture('realtime-job-event-replay.message.json'), event, 'Lost ACK replay preserves the exact envelope.');
assert.equal(fixture('realtime-ack.message.json').payload.acknowledgedMessageId, event.messageId);
assert.equal(fixture('realtime-error.message.json').messageId, event.messageId, 'Frame errors retain request correlation.');
const largeJob = fixture('realtime-large-pdf.response.json');
assert(valid('PrintJob', largeJob), ajv.errorsText());
assert.equal(largeJob.contentLength, settings.maxPdfBytes);
assert(largeJob.contentLength > 20 * 1024 * 1024);
assert(valid('PrintOptions', { copies: 32767 }));
assert(!valid('PrintOptions', { copies: 32768 }));
console.log('Realtime directional frames, defaults/ranges, policy/ceiling refusal and exact replay fixtures passed; runtime concurrency acceptance remains consumer-owned.');
