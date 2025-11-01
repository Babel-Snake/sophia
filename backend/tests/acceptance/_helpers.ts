import jwt from 'jsonwebtoken';
import type { SuperTest, Test } from 'supertest';


// Change to your real secret only in tests/dev; production uses Firebase
const TEST_JWT_SECRET = 'test-secret';


export const CANON = {
ORG: '11111111-1111-1111-1111-111111111111',
SUP: '22222222-2222-2222-2222-222222222222',
STU: '33333333-3333-3333-3333-333333333333',
};


export function authHeader(userId: string, role: 'student'|'mentor'|'supervisor'|'admin', orgId = CANON.ORG) {
const token = jwt.sign({ orgId, userId, role }, TEST_JWT_SECRET, { algorithm: 'HS256' });
return `Bearer ${token}`;
}


export function expectPaymentRequired(res: { status: number; body?: any }){
if (res.status !== 402) {
throw new Error(`Expected 402 Payment Required, got ${res.status} with body: ${JSON.stringify(res.body)}`);
}
}


export async function get<T>(req: any, url: string, auth?: string) {
return req.get(url).set('Authorization', auth ?? '').set('Content-Type', 'application/json');
}
export async function post<T>(req: any, url: string, body?: any, auth?: string) {
return req.post(url).set('Authorization', auth ?? '').send(body ?? {});
}
export async function put<T>(req: any, url: string, body?: any, auth?: string) {
return req.put(url).set('Authorization', auth ?? '').send(body ?? {});
}
export async function patch<T>(req: any, url: string, body?: any, auth?: string) {
return req.patch(url).set('Authorization', auth ?? '').send(body ?? {});
}