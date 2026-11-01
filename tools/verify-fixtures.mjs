// Copyright 2026 Kingsrook, LLC
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fixtureTypes } from './fixture-types.mjs';

const schema = JSON.parse(readFileSync(new URL('../schemas/protocol.schema.json', import.meta.url), 'utf8'));
const root = new URL('../fixtures/', import.meta.url);

// Validate the schema keywords used by this contract without installing dependencies.
function validate(value, rule, path)
{
   if(typeof rule === 'boolean')
   {
      assert(rule, `${path}: forbidden property`);
      return;
   }
   if(rule.$ref)
   {
      return validate(value, schema.$defs[rule.$ref.split('/').at(-1)], path);
   }
   if(rule.anyOf)
   {
      assert(rule.anyOf.some(candidate =>
      {
         try { validate(value, candidate, path); return true; }
         catch { return false; }
      }), `${path}: no anyOf variant matched`);
   }
   if(rule.const !== undefined) assert.deepEqual(value, rule.const, path);
   if(rule.enum) assert(rule.enum.includes(value), `${path}: invalid enum`);
   if(rule.type === 'null') assert.equal(value, null, path);
   if(rule.type === 'object')
   {
      assert(value !== null && typeof value === 'object' && !Array.isArray(value), `${path}: expected object`);
      for(const name of rule.required ?? []) assert(name in value, `${path}.${name}: required`);
      if(rule.additionalProperties === false)
      {
         for(const name of Object.keys(value)) assert(name in (rule.properties ?? {}), `${path}.${name}: unknown property`);
      }
      for(const [name, child] of Object.entries(rule.properties ?? {}))
      {
         if(name in value) validate(value[name], child, `${path}.${name}`);
      }
      for(const [name, dependencies] of Object.entries(rule.dependentRequired ?? {}))
      {
         if(name in value) for(const dependency of dependencies) assert(dependency in value, `${path}.${dependency}: required with ${name}`);
      }
   }
   if(rule.type === 'array')
   {
      assert(Array.isArray(value), `${path}: expected array`);
      if(rule.minItems !== undefined) assert(value.length >= rule.minItems, path);
      if(rule.maxItems !== undefined) assert(value.length <= rule.maxItems, path);
      if(rule.uniqueItems) assert.equal(new Set(value.map(item => JSON.stringify(item))).size, value.length, path);
      if(rule.contains)
      {
         assert(value.some(item =>
         {
            try { validate(item, rule.contains, path); return true; }
            catch { return false; }
         }), `${path}: required array member missing`);
      }
      value.forEach((item, index) => validate(item, rule.items, `${path}[${index}]`));
   }
   if(rule.type === 'string')
   {
      assert.equal(typeof value, 'string', path);
      if(rule.minLength !== undefined) assert(value.length >= rule.minLength, path);
      if(rule.maxLength !== undefined) assert(value.length <= rule.maxLength, path);
      if(rule.pattern) assert(new RegExp(rule.pattern).test(value), path);
      if(rule.format === 'date-time') assert(!Number.isNaN(Date.parse(value)) && value.endsWith('Z'), `${path}: UTC date-time required`);
      if(rule.contentEncoding === 'base64') assert.equal(Buffer.from(value, 'base64').toString('base64'), value, path);
   }
   if(rule.type === 'boolean') assert.equal(typeof value, 'boolean', path);
   if(rule.type === 'integer' || rule.type === 'number')
   {
      assert.equal(typeof value, 'number', path);
      assert(Number.isFinite(value), path);
      if(rule.type === 'integer') assert(Number.isInteger(value), path);
      if(rule.minimum !== undefined) assert(value >= rule.minimum, path);
      if(rule.maximum !== undefined) assert(value <= rule.maximum, path);
      if(rule.exclusiveMinimum !== undefined) assert(value > rule.exclusiveMinimum, path);
   }
}

const fixtures = {};
for(const [name, type] of Object.entries(fixtureTypes))
{
   fixtures[name] = JSON.parse(readFileSync(new URL(name, root), 'utf8'));
   validate(fixtures[name], schema.$defs[type], name);
}
const content = readFileSync(new URL('test-label.zpl', root));
const job = fixtures['claim.response.json'].job;
assert.equal(content.length, job.contentLength);
assert.equal(createHash('sha256').update(content).digest('hex'), job.contentSha256);
assert.deepEqual(Buffer.from(fixtures['submit.request.json'].contentBase64, 'base64'), content);
assert.deepEqual(fixtures['job.response.json'], job);
assert.throws(() => validate({ copies: 0 }, schema.$defs.PrintOptions, 'invalidCopies'));
assert.throws(() => validate({ paperWidthMm: 100 }, schema.$defs.PrintOptions, 'missingHeight'));
assert.throws(() => validate({ eventId: 'test', status: 'PRINTED' }, schema.$defs.JobEvent, 'invalidStatus'));
assert.throws(() => validate({ name: 'x'.repeat(513) }, schema.$defs.DeviceProfile, 'oversizedName'));
assert.throws(() => validate({ description: 'x'.repeat(4097) }, schema.$defs.DeviceProfile, 'oversizedDescription'));
assert.throws(() => validate({ location: 'x'.repeat(513) }, schema.$defs.DeviceProfile, 'oversizedLocation'));
validate({ name: '', description: null }, schema.$defs.DeviceProfile, 'clearAndPreserve');
const brandedTest = fixtures['device-test-profile.request.json'];
assert.throws(() => validate({ ...brandedTest, testProfile: 'LETTER' }, schema.$defs.DeviceTestPrintRequest, 'incompatibleLabelMedia'));
assert.throws(() => validate({ ...brandedTest, testProfile: 'UNKNOWN' }, schema.$defs.DeviceTestPrintRequest, 'unknownTestProfile'));
assert.throws(() => validate({ ...brandedTest, testProfile: null }, schema.$defs.DeviceTestPrintRequest, 'nullTestProfile'));
assert.throws(() => validate({ format: 'PDF' }, schema.$defs.DeviceTestPrintRequest, 'missingTestIdentity'));
validate({ ...brandedTest, format: 'PDF', testProfile: 'A4' }, schema.$defs.DeviceTestPrintRequest, 'a4TestPage');
const clear = fixtures['action-clear-queue.request.json'];
assert.throws(() => validate({ ...clear, issuedAt: undefined }, schema.$defs.AdminDeviceActionRequest, 'missingIssuedAt'));
assert.throws(() => validate({ ...clear, jobId: 'job-example-1' }, schema.$defs.AdminDeviceActionRequest, 'clearCannotTargetSpool'));
assert.throws(() => validate({ ...clear, action: 'RESTART_SERVICE' }, schema.$defs.AdminDeviceActionRequest, 'arbitraryServiceControl'));
assert.throws(() => validate({ ...clear, command: 'shell' }, schema.$defs.AdminDeviceActionRequest, 'unknownCommandProperty'));
assert.throws(() => validate({ ...clear, action: 'CANCEL_SPOOL' }, schema.$defs.AdminDeviceActionRequest, 'cancelRequiresJobIdentity'));
assert.throws(() => validate({ ...fixtures['control-poll.request.json'], capabilities: ['CANCEL_SPOOL', 'CANCEL_SPOOL'] }, schema.$defs.DeviceControlPollRequest, 'duplicateCapability'));
assert.throws(() => validate({ ...fixtures['control-cancel-requested.receipt.json'], outcome: 'PRINT_RECALLED' }, schema.$defs.DeviceCommandReceipt, 'unsupportedPaperClaim'));
console.log(`Validated ${Object.keys(fixtures).length} protocol fixtures, content integrity, and invalid-input checks.`);
