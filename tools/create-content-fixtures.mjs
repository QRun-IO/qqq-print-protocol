// Copyright 2026 Kingsrook, LLC
// SPDX-License-Identifier: Apache-2.0

import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

// Keep printable fixtures synthetic and independent of a printer's settings.
const content = Buffer.from('^XA\n^FO40,40^A0N,36,36^FDQQQ cloud print test^FS\n^FO40,90^A0N,24,24^FDProtocol v1 - one test label^FS\n^XZ\n', 'utf8');
const root = new URL('../fixtures/', import.meta.url);
writeFileSync(new URL('test-label.zpl', root), content);

const job = {
   jobId: 'job-example',
   deviceId: 'device-example',
   printerId: 'zebra-example',
   title: 'QQQ cloud print test',
   format: 'ZPL',
   contentSha256: createHash('sha256').update(content).digest('hex'),
   contentLength: content.length,
   options: { copies: 1, scale: 'ACTUAL_SIZE' },
   createdAt: '2026-10-29T18:00:00Z',
   status: 'CLAIMED'
};
const request = {
   deviceId: job.deviceId,
   printerId: job.printerId,
   title: job.title,
   format: job.format,
   contentBase64: content.toString('base64'),
   idempotencyKey: 'protocol-fixture-label-v1',
   options: job.options
};
writeFileSync(new URL('submit.request.json', root), JSON.stringify(request, null, 2) + '\n');
writeFileSync(new URL('claim.response.json', root), JSON.stringify({ job }, null, 2) + '\n');
writeFileSync(new URL('job.response.json', root), JSON.stringify(job, null, 2) + '\n');
