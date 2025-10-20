import request from 'supertest';
import { authHeader, CANON, post } from './_helpers';


const base = process.env.BASE_URL ?? 'http://localhost:3000';
const req = request(base);


describe('Reports (PDF)', () => {
it('returns an artifact URL (PDF when enabled)', async () => {
const res = await post(req, '/reports/run', {
org_id: CANON.ORG,
template_key: 'acara-term-summary',
}, authHeader(CANON.SUP, 'supervisor'));
expect([200,202]).toContain(res.status);
expect(typeof res.body.artifact_url).toBe('string');
expect(res.body.artifact_url).toMatch(/\.(html|pdf)$/);
});
});