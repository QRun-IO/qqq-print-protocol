// Copyright 2026 Kingsrook, LLC
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const schema = JSON.parse(readFileSync(new URL("../schemas/protocol.schema.json", import.meta.url), "utf8"));
const ajv = new Ajv2020({ strict: true, allErrors: true });
// ajv-formats is callable CommonJS; its NodeNext declaration exposes a namespace.
/** @type {import("ajv-formats").FormatsPlugin} */ (/** @type {unknown} */ (addFormats))(ajv);
ajv.addSchema(schema);
/** @param {string} name @returns {Record<string,unknown>} */
const fixture = name => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8"));
/** @param {string} type @param {unknown} value @returns {boolean|Promise<unknown>} */
const valid = (type, value) => ajv.validate(`${schema.$id}#/$defs/${type}`, value);
const settings = /** @type {typeof import("../fixtures/realtime-settings.payload.json")} */ (/** @type {unknown} */ (fixture("realtime-settings.payload.json")));
const hello = /** @type {typeof import("../fixtures/realtime-hello.message.json")} */ (/** @type {unknown} */ (fixture("realtime-hello.message.json")));
const extension = fixture("printing-realtime-extension.discovery.json");
assert(valid("PrintingRealtimeExtensionDiscovery", extension), ajv.errorsText());
assert.equal(extension["version"], "2.0.0");
assert(valid("PrintingRealtimeExtensionDiscovery", { ...extension, version: "2.7.3" }));
for(const version of ["1.0.0", "1.1.0", "3.0.0", "2.0", "2.01.0", "2.0.0-rc.1", null])
{
   assert(!valid("PrintingRealtimeExtensionDiscovery", { ...extension, version }), "Only the compatible stable native major is accepted.");
}
assert(!valid("PrintingRealtimeExtensionDiscovery", { ...extension, name: "another-extension" }));
assert(!valid("PrintingRealtimeExtensionDiscovery", { ...extension, pathPrefix: "/printing/v1" }));
const approvalExtension = fixture("printing-realtime-extension-240.discovery.json");
assert(valid("PrintingRealtimeExtensionDiscovery", approvalExtension), ajv.errorsText());
assert.equal(approvalExtension["version"], "2.4.0", "printer-approval-v1 has feature minimum 2.4.0.");
assert.deepEqual({ ...approvalExtension, version: extension["version"] }, extension, "2.4.0 keeps the 2.x descriptor name and path prefix.");

/*******************************************************************************
 ** Cross-field policy relationships require semantic checks beyond JSON Schema.
 *******************************************************************************/
/** @param {typeof settings} policy @param {typeof hello.payload.limits} limits @returns {void} */
function assertPolicy(policy, limits)
{
   assert(valid("RealtimeSettings", policy), ajv.errorsText());
   assert(valid("RealtimeClientLimits", limits), ajv.errorsText());
   assert(policy.maxQueuedFrameBytes >= policy.maxFrameBytes, "Frame queue must hold one permitted message.");
   assert(policy.maxStagedBytes >= Math.max(policy.maxPdfBytes, policy.maxZplBytes), "Staging must admit one permitted document.");
   assert(policy.downloadTimeoutMillis >= policy.downloadConnectTimeoutMillis);
   assert(policy.downloadTimeoutMillis >= policy.downloadIdleTimeoutMillis);
   assert(policy.heartbeatTimeoutSeconds >= 2 * policy.heartbeatIntervalSeconds);
   assert(policy.reconnectMaxDelayMillis >= policy.reconnectMinDelayMillis);
   for(const name of /** @type {(keyof typeof hello.payload.limits)[]} */ (schema.$defs.RealtimeClientLimits.required))
   {
      assert(policy[name] <= limits[name], `${name}: policy exceeds declared client capability`);
   }
}

assertPolicy(settings, hello.payload.limits);
assert.equal(settings.maxConcurrentDownloads, 1, "Initial deployment defaults to one configurable download lane.");
assert.equal(settings.maxCopies, 100);
assert.equal(settings.nativeSubmissionTimeoutMillis, 120000);
for(const [name, rule] of Object.entries(/** @type {Record<keyof typeof settings,{default?:number,minimum:number,maximum:number}>} */ (schema.$defs.RealtimeSettings.properties)))
{
   if(rule.default !== undefined)
   {
      assert.equal(settings[/** @type {keyof typeof settings} */ (name)], rule.default, `${name}: fixture/schema default mismatch`);
   }
   /** @type {Partial<typeof settings>} */
   const missing = { ...settings };
   // Negative evidence deliberately removes each required schema field.
   // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
   delete missing[/** @type {keyof typeof settings} */ (name)];
   assert(!valid("RealtimeSettings", missing), `${name}: missing value cannot inherit a default`);
   for(const value of [rule.minimum - 1, rule.maximum + 1, 1.5, null])
   {
      assert(!valid("RealtimeSettings", { ...settings, [name]: value }), `${name}: invalid bound/type accepted`);
   }
}
for(const change of [
   { maxQueuedFrameBytes: 8192 },
   { maxStagedBytes: 1 },
   { downloadTimeoutMillis: 1000 },
   { heartbeatTimeoutSeconds: 10 },
   { reconnectMinDelayMillis: 60000, reconnectMaxDelayMillis: 1000 },
])
{
   assert.throws(() => assertPolicy({ ...settings, ...change }, hello.payload.limits));
}
for(const name of /** @type {(keyof typeof hello.payload.limits)[]} */ (schema.$defs.RealtimeClientLimits.required))
{
   assert.throws(() => assertPolicy(settings, { ...hello.payload.limits, [name]: settings[/** @type {keyof typeof settings} */ (name)] - 1 }), name);
}
assertPolicy({ ...settings, maxConcurrentDownloads: 16, maxConcurrentPrints: 16, maxCopies: 32767 }, hello.payload.limits);
assert(!valid("RealtimeHello", { ...hello, payload: { ...hello.payload, capabilities: [] } }));
assert(!valid("RealtimeHello", { ...hello, payload: { ...hello.payload, capabilities: ["CANCEL_SPOOL"] } }));
assert(!valid("RealtimeHello", { ...hello, payload: { ...hello.payload, limits: {} } }));
assert(!valid("RealtimeHello", { ...hello, messageId: "hello:unsafe-prefix" }));
assert(!valid("RealtimeHello", { ...hello, token: "not-a-real-token" }));
assert(!valid("RealtimeClientMessage", { type: "RUN_SHELL", messageId: "unsupported-1", payload: {} }));

/*******************************************************************************
 ** Capability hellos: the 2.3.0 four-capability and 2.4.0 five-capability peers
 ** both remain valid; the list is bounded, unique and closed.
 *******************************************************************************/
const mediaHello = /** @type {typeof hello} */ (/** @type {unknown} */ (fixture("realtime-media-hello.message.json")));
const approvalHello = /** @type {typeof import("../fixtures/realtime-approval-hello.message.json")} */ (/** @type {unknown} */ (fixture("realtime-approval-hello.message.json")));
assert(valid("RealtimeHello", mediaHello), ajv.errorsText());
assert(valid("RealtimeHello", approvalHello), ajv.errorsText());
assert.equal(approvalHello.payload.capabilities.length, 5);
assert(approvalHello.payload.capabilities.includes("printer-approval-v1"));
assert.deepEqual(approvalHello.payload.limits, hello.payload.limits, "Approval negotiation does not change declared ceilings.");
assert(!valid("RealtimeHello", { ...approvalHello, payload: { ...approvalHello.payload, capabilities: [...approvalHello.payload.capabilities, "printer-approval-v1"] } }), "Duplicate capability accepted");
assert(!valid("RealtimeHello", { ...approvalHello, payload: { ...approvalHello.payload, capabilities: [...approvalHello.payload.capabilities, "printer-approval-v2"] } }), "Unknown sixth capability accepted");
assert(!valid("RealtimeHello", { ...hello, payload: { ...hello.payload, capabilities: ["printer-approval-v1"] } }), "realtime-v1 remains mandatory");

const clientFixtures = ["hello", "state-applied", "job-event", "command-receipt", "heartbeat", "inventory", "ping"];
const serverFixtures = ["welcome", "desired-state", "job-available", "printers", "command", "settings", "ack", "error", "pong"];
for(const [files, accepted, rejected] of /** @type {[string[],string,string][]} */ ([
   [clientFixtures, "RealtimeClientMessage", "RealtimeServerMessage"],
   [serverFixtures, "RealtimeServerMessage", "RealtimeClientMessage"],
]))
{
   for(const name of files)
   {
      const message = fixture(`realtime-${name}.message.json`);
      assert(valid(accepted, message), `${name}: ${ajv.errorsText()}`);
      assert(!valid(rejected, message), `${name}: wrong-direction frame accepted`);
      assert(Buffer.byteLength(JSON.stringify(message), "utf8") <= settings.maxFrameBytes);
      const missing = { ...message };
      delete missing["payload"];
      assert(!valid(accepted, missing), `${name}: missing payload accepted`);
      assert(!valid(accepted, { ...message, contentUrl: "https://unrelated.invalid/document" }));
   }
}
/*******************************************************************************
 ** PRINTERS carries the complete approval state of the latest accepted inventory;
 ** entries are bounded, both fields are required and the envelope stays closed.
 *******************************************************************************/
const printers = /** @type {typeof import("../fixtures/realtime-printers.message.json")} */ (/** @type {unknown} */ (fixture("realtime-printers.message.json")));
assert.equal(printers.payload.printers.length, 2);
assert.deepEqual(printers.payload.printers.map(printer => printer.enabled), [true, false], "Fixture shows one approved and one awaiting printer.");
assert(valid("RealtimePrinters", { ...printers, payload: { printers: [] } }), "An empty inventory yields an empty approval list.");
assert(valid("RealtimePrinters", { ...printers, payload: { printers: Array(200).fill(printers.payload.printers[0]) } }));
assert(!valid("RealtimePrinters", { ...printers, payload: { printers: Array(201).fill(printers.payload.printers[0]) } }));
assert(valid("RealtimePrinters", { ...printers, payload: { ...printers.payload, futureField: true } }), "Additive payload fields remain compatible.");
assert(valid("RealtimePrinters", { ...printers, payload: { printers: [{ ...printers.payload.printers[0], futureField: true }] } }));
assert(!valid("RealtimePrinters", { ...printers, payload: { printers: [{ printerId: "laser-example" }] } }), "enabled is required");
assert(!valid("RealtimePrinters", { ...printers, payload: { printers: [{ enabled: true }] } }), "printerId is required");
assert(!valid("RealtimePrinters", { ...printers, payload: { printers: [{ printerId: "laser-example", enabled: "true" }] } }), "enabled must be boolean");
assert(!valid("RealtimePrinters", { ...printers, payload: { printers: [{ printerId: "", enabled: true }] } }));
assert(!valid("RealtimePrinters", { ...printers, payload: {} }), "printers list is required");
assert(!valid("RealtimePrinters", { ...printers, type: "JOB_AVAILABLE" }));
assert(!valid("RealtimeJobAvailable", { ...printers, type: "JOB_AVAILABLE" }), "PRINTERS payload is not the empty wake-up");

const event = fixture("realtime-job-event.message.json");
assert.deepEqual(fixture("realtime-job-event-replay.message.json"), event, "Lost ACK replay preserves the exact envelope.");
assert.equal((/** @type {typeof import("../fixtures/realtime-ack.message.json")} */ (/** @type {unknown} */ (fixture("realtime-ack.message.json")))).payload.acknowledgedMessageId, event["messageId"]);
assert.equal(fixture("realtime-error.message.json")["messageId"], event["messageId"], "Frame errors retain request correlation.");
const largeJob = /** @type {typeof import("../fixtures/realtime-large-pdf.response.json")} */ (/** @type {unknown} */ (fixture("realtime-large-pdf.response.json")));
assert(valid("PrintJob", largeJob), ajv.errorsText());
assert.equal(largeJob.contentLength, settings.maxPdfBytes);
assert(largeJob.contentLength > 20 * 1024 * 1024);
assert(valid("PrintOptions", { copies: 32767 }));
assert(!valid("PrintOptions", { copies: 32768 }));
console.log("Realtime directional frames, defaults/ranges, policy/ceiling refusal and exact replay fixtures passed; runtime concurrency acceptance remains consumer-owned.");
