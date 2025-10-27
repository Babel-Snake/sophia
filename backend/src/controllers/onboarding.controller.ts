import { Request, Response, NextFunction } from "express";
import { startInputSchema, StartOutput, getOutputSchema } from "../services/onboarding.types";
import * as svc from "../services/onboarding.service";

export async function start(req: Request, res: Response, next: NextFunction) {
  try {
    const input = startInputSchema.parse(req.body ?? {});
    const out = await svc.start(input, req);
    const json: StartOutput = out;
    res.status(201).json(json);
  } catch (e) { next(e); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const out = await svc.get({ id: req.params.id }, req);
    res.json(getOutputSchema.parse(out));
  } catch (e) { next(e); }
}