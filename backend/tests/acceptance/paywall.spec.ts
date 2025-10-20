import request from 'supertest';
import { authHeader, expectPaymentRequired, CANON, post } from './_helpers';


const base = process.env.BASE_URL ?? 'http://localhost:3000';
const req = request(base);


describe('Paywall', () => {
it('blocks reports when org has no active subscription', async () => {
const OTHER = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const res = await post(req, '/reports/run', {
org_id: OTHER,
template_key: 'acara-term-summary',
}, authHeader(CANON.STU, 'student', OTHER));
expectPaymentRequired(res);
});
});