import request from 'supertest';
import { authHeader, CANON, post, get } from './_helpers';


const base = process.env.BASE_URL ?? 'http://localhost:3000';
const req = request(base);


describe('Quizzes (review)', () => {
it('generates a quiz, fetches items, submits answers, and returns retention index', async () => {
const gen = await post(req, '/quizzes/generate', {
org_id: CANON.ORG,
student_user_id: CANON.STU,
from_days: 30,
size: 5,
}, authHeader(CANON.STU, 'student'));
expect(gen.status).toBe(201);


const quizId = gen.body.id;
const got = await get(req, `/quizzes/${quizId}`, authHeader(CANON.STU, 'student'));
expect(got.status).toBe(200);
expect(got.body.items.length).toBeGreaterThan(0);


const responses = got.body.items.map((it: any) => ({
item_id: it.id,
response: it.item_type === 'mcq' ? it.choices?.[0] : 'my answer',
}));


const sub = await post(req, `/quizzes/${quizId}/submit`, { responses }, authHeader(CANON.STU, 'student'));
expect(sub.status).toBe(200);
expect(sub.body).toHaveProperty('retention_index');
});
});