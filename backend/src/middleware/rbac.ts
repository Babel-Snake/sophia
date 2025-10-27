import { Request, Response, NextFunction } from "express";

export function requireRoles(roles: Array<"supervisor"|"mentor"|"student">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = (req as any).role as string | undefined;
    if (!roles.includes((role as any))) return next(Object.assign(new Error("Forbidden"), { status: 403 }));
    next();
  };
}

export function requireSubscription(feature: "planning"|"evidence"|"quizzes"|"reports") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const sub = (req as any).subscription as { active: boolean; features?: string[] }|undefined;
    if (!sub?.active || (sub.features && !sub.features.includes(feature))) {
      return next(Object.assign(new Error("Payment Required"), { status: 402 }));
    }
    next();
  };
}

export const requireSubscriptionIf = requireSubscription;