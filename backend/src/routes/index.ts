import { Router } from "express";
import onboarding from "./onboarding";
const router = Router();
router.use("/onboarding", onboarding);
export default router;