import { Request } from "express";
import { StartInput, StartOutput, GetOutput } from "./onboarding.types";
import { pregenUuid } from "../utils/uuid";

type Row = { id: string; step: "created"|"seeded_plan"|"baseline_quiz"|"done"; next: string };
const inMemory: Record<string, Row> = {};

export async function start(_input: StartInput, _req: Request): Promise<StartOutput> {
  const id = pregenUuid("onboarding");
  const step: Row["step"] = "created";
  const next = `/onboarding/${id}`;
  inMemory[id] = { id, step, next };
  return { id, step, next };
}

export async function get({ id }: { id: string }, _req: Request): Promise<GetOutput> {
  const row = inMemory[id];
  if (!row) throw Object.assign(new Error("Not found"), { status: 404 });
  return row;
}