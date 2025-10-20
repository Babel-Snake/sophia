import request from 'supertest';
import { authHeader, CANON, post, get } from './_helpers';


const base = process.env.BASE_URL ?? 'http://localhost:3000';
const req = request(base);


describe('Nudges', () => {
it('runs the admin nudge job and lists student nudges', async () => {
const run = await post(req, '/admin/nudges/run', {}, authHeader(CANON.SUP, 'supervisor'));
expect(run.status).toBe(200);


const list = await get(req, '/nudges', authHeader(CANON.STU, 'student'));
expect(list.status).toBe(200);
expect(Array.isArray(list.body.data)).toBe(true);
});
});