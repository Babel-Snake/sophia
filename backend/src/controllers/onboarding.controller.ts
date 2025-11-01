import { Request, Response } from 'express';
import { OnboardingService } from '../services/onboarding.service';
import { z } from 'zod';

const onboardingService = new OnboardingService();

// Validation schemas
const StartOnboardingSchema = z.object({
  org_name: z.string().min(1),
  supervisor_name: z.string().min(1),
  student_display_name: z.string().min(1),
});

/**
 * POST /onboarding/start
 * Create org + supervisor + student, seed first plan + baseline quiz
 */
export async function startOnboarding(req: Request, res: Response) {
  try {
    const body = StartOnboardingSchema.parse(req.body);
    const result = await onboardingService.startOnboarding(body);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request body', details: error.errors });
    }
    console.error('Error starting onboarding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /onboarding/:id
 * Get onboarding status
 */
export async function getOnboardingStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const status = await onboardingService.getOnboardingStatus(id);

    if (!status) {
      return res.status(404).json({ error: 'Onboarding session not found' });
    }

    res.status(200).json(status);
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
