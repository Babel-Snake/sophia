import { Router } from "express";
import * as ctrl from "../controllers/onboarding.controller";
import { requireAuthOptional, attachOrgFromToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";

const r = Router();
// POST /onboarding/start
r.post("/start", requireAuthOptional, ctrl.start);
// GET /onboarding/:id
r.get("/:id", attachOrgFromToken, requireRoles(["supervisor","mentor","student"]), ctrl.get);
export default r;