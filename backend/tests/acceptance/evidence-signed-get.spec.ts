import request from 'supertest';
import { authHeader, CANON, get } from './_helpers';


const base = process.env.BASE_URL ?? 'http://localhost:3000';
const req = request(base);


describe('Evidence signed GET', () => {
it('returns signed GET URLs for existing evidence', async () => {
// Seed should include at least one submission/evidence or the upload test runs first
const seededSubmissionId = process.env.SEED_SUBMISSION_ID || '00000000-0000-0000-0000-000000000000';
const res = await get(req, `/submissions/${seededSubmissionId}/evidence`, authHeader(CANON.STU, 'student'));
expect(res.status).toBe(200);
expect(res.body).toHaveProperty('data');
});
});