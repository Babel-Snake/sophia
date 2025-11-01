import { Router } from 'express';
import * as onboardingController from '../controllers/onboarding.controller';

const router = Router();

// POST /onboarding/start - public endpoint (no auth required per RBAC)
router.post('/start', onboardingController.startOnboarding);

// GET /onboarding/:id - requires auth per RBAC
router.get('/:id', onboardingController.getOnboardingStatus);

export default router;
