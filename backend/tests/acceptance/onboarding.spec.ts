import request from 'supertest';
import { authHeader, CANON, post, get } from './_helpers';


const base = process.env.BASE_URL ?? 'http://localhost:3000';
const req = request(base);


describe('Onboarding', () => {
it('creates org + supervisor + student and returns baseline quiz id', async () => {
const res = await post(req, '/onboarding/start', {
org_name: 'Pilot Org',
supervisor_name: 'Parent Pat',
student_display_name: 'Learner Lee',
});
expect(res.status).toBe(201);
expect(res.body).toMatchObject({ org_id: expect.any(String), supervisor_user_id: expect.any(String), student_user_id: expect.any(String) });
expect(res.body.first_quiz_id).toBeDefined();


const status = await get(req, `/onboarding/${res.body.id}`);
expect(status.status).toBe(200);
expect(status.body).toHaveProperty('step');
});
});