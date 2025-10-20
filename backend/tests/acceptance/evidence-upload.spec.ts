import request from 'supertest';
import { authHeader, CANON, post, get } from './_helpers';


const base = process.env.BASE_URL ?? 'http://localhost:3000';
const req = request(base);


async function createSubmission() {
const ti = await post(req, '/tasks/instances', {
org_id: CANON.ORG,
student_user_id: CANON.STU,
title: 'Number facts practice',
description: '30‑min warmup',
}, authHeader(CANON.SUP, 'supervisor'));
expect(ti.status).toBe(201);


const sub = await post(req, `/tasks/instances/${ti.body.id}/submissions`, undefined, authHeader(CANON.STU, 'student'));
expect(sub.status).toBe(201);
return sub.body.id as string;
}


describe('Evidence upload', () => {
it('issues presigned PUT, finalizes metadata, and lists evidence', async () => {
const submissionId = await createSubmission();


const pre = await post(req, '/evidence/signed-url', {
submission_id: submissionId,
filename: 'work.jpg',
content_type: 'image/jpeg',
bytes: 1024,
}, authHeader(CANON.STU, 'student'));
expect(pre.status).toBe(200);
expect(pre.body).toHaveProperty('upload_url');
expect(pre.body).toHaveProperty('object_key');


const fin = await post(req, '/evidence', {
submission_id: submissionId,
type: 'file',
object_key: pre.body.object_key,
content_type: 'image/jpeg',
bytes: 1024,
}, authHeader(CANON.STU, 'student'));
expect(fin.status).toBe(201);


const list = await get(req, `/submissions/${submissionId}/evidence`, authHeader(CANON.STU, 'student'));
expect(list.status).toBe(200);
expect(list.body.data.length).toBeGreaterThan(0);
expect(list.body.data[0]).toHaveProperty('url'); // signed GET URL or public URL
});
});