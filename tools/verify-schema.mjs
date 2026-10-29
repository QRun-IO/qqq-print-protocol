import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { fixtureTypes } from './fixture-types.mjs';

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
console.log(`Compiled ${Object.keys(schema.$defs).length} JSON Schema 2020-12 definitions; ${Object.keys(fixtureTypes).length} fixtures passed full schema validation.`);
