import request from 'supertest';
import { authHeader, CANON, post, get, patch } from './_helpers';


const base = process.env.BASE_URL ?? 'http://localhost:3000';
const req = request(base);


describe('Planning Lite', () => {
it('generates a plan and updates a slot', async () => {
const gen = await post(req, '/plans/generate', {
org_id: CANON.ORG,
student_user_id: CANON.STU,
week_start: new Date().toISOString().slice(0,10),
targets: { Maths: { minutes: 60 }, English: { minutes: 60 } },
include_review: true,
}, authHeader(CANON.STU, 'student'));
expect(gen.status).toBe(200);


const planId = gen.body.id;
const firstSlot = gen.body.slots?.[0]?.id;
expect(firstSlot).toBeDefined();


const upd = await patch(req, `/plans/${planId}/slot/${firstSlot}`, { status: 'skipped' }, authHeader(CANON.STU, 'student'));
expect(upd.status).toBe(200);
});
});