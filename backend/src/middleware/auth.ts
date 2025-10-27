import { Request, Response, NextFunction } from "express";

export function requireAuthOptional(req: Request, _res: Response, next: NextFunction) {
  const h = req.headers as any;
  (req as any).userId = h["x-mock-user"] || undefined;
  (req as any).role = h["x-mock-role"] || "supervisor";
  (req as any).orgId = h["x-mock-org"] || process.env.SEED_ORG_ID;
  (req as any).subscription = { active: true, features: ["planning","evidence","quizzes","reports"] };
  next();
}

export function attachOrgFromToken(req: Request, _res: Response, next: NextFunction) {
  if (!(req as any).orgId) (req as any).orgId = process.env.SEED_ORG_ID;
  next();
}