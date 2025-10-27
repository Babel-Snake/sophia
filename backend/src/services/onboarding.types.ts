import { z } from "zod";
export const startInputSchema = z.object({
  supervisor_email: z.string().email().optional(),
  student_name: z.string().min(1).optional(),
});
export type StartInput = z.infer<typeof startInputSchema>;

export const startOutputSchema = z.object({
  id: z.string().uuid(),
  step: z.enum(["created","seeded_plan","baseline_quiz"]),
  next: z.string(),
});
export type StartOutput = z.infer<typeof startOutputSchema>;

export const getOutputSchema = z.object({
  id: z.string().uuid(),
  step: z.enum(["created","seeded_plan","baseline_quiz","done"]),
  next: z.string(),
});
export type GetOutput = z.infer<typeof getOutputSchema>;