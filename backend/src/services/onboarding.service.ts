import { sequelize } from '../db/connection';
import { QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export interface StartOnboardingInput {
  org_name: string;
  supervisor_name: string;
  student_display_name: string;
}

export interface OnboardingStartResponse {
  id: string;
  org_id: string;
  supervisor_user_id: string;
  student_user_id: string;
  first_quiz_id?: string;
}

export interface OnboardingStatus {
  id: string;
  step: 'created' | 'seeded' | 'complete';
  next: string[];
}

export class OnboardingService {
  /**
   * Start onboarding: create org + supervisor + student + baseline quiz
   * Pre-generate all UUIDs (no SQL RETURNING)
   */
  async startOnboarding(input: StartOnboardingInput): Promise<OnboardingStartResponse> {
    // Pre-generate UUIDs
    const sessionId = uuidv4();
    const orgId = uuidv4();
    const supervisorId = uuidv4();
    const studentId = uuidv4();
    const supervisorMemberId = uuidv4();
    const studentMemberId = uuidv4();
    const studentProfileId = uuidv4();
    const subscriptionId = uuidv4();
    const quizId = uuidv4();

    // Transaction to create all entities
    const transaction = await sequelize.transaction();
    try {
      // 1. Create org
      await sequelize.query(
        'INSERT INTO orgs (id, name) VALUES (?, ?)',
        { replacements: [orgId, input.org_name], transaction }
      );

      // 2. Create supervisor user
      await sequelize.query(
        'INSERT INTO users (id, display_name) VALUES (?, ?)',
        { replacements: [supervisorId, input.supervisor_name], transaction }
      );

      // 3. Create student user
      await sequelize.query(
        'INSERT INTO users (id, display_name) VALUES (?, ?)',
        { replacements: [studentId, input.student_display_name], transaction }
      );

      // 4. Add supervisor to org
      await sequelize.query(
        'INSERT INTO org_members (id, org_id, user_id, role) VALUES (?, ?, ?, ?)',
        { replacements: [supervisorMemberId, orgId, supervisorId, 'supervisor'], transaction }
      );

      // 5. Add student to org
      await sequelize.query(
        'INSERT INTO org_members (id, org_id, user_id, role) VALUES (?, ?, ?, ?)',
        { replacements: [studentMemberId, orgId, studentId, 'student'], transaction }
      );

      // 6. Create student profile
      await sequelize.query(
        'INSERT INTO student_profiles (id, user_id, grade_level) VALUES (?, ?, ?)',
        { replacements: [studentProfileId, studentId, 5], transaction }
      );

      // 7. Create trial subscription
      const trialDays = parseInt(process.env.TRIAL_DAYS || '14', 10);
      const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

      await sequelize.query(
        'INSERT INTO subscriptions (id, org_id, plan_name, status, trial_ends_at) VALUES (?, ?, ?, ?, ?)',
        {
          replacements: [
            subscriptionId,
            orgId,
            process.env.PLAN_HOMESCHOOL_MONTHLY || 'homeschool_monthly',
            'trial',
            trialEndsAt,
          ],
          transaction,
        }
      );

      // 8. Create baseline quiz
      await sequelize.query(
        'INSERT INTO quizzes (id, org_id, student_user_id, title, status) VALUES (?, ?, ?, ?, ?)',
        {
          replacements: [quizId, orgId, studentId, 'Baseline Quiz', 'active'],
          transaction,
        }
      );

      // 9. Create onboarding session
      await sequelize.query(
        'INSERT INTO onboarding_sessions (id, org_id, supervisor_user_id, student_user_id, first_quiz_id, step) VALUES (?, ?, ?, ?, ?, ?)',
        {
          replacements: [sessionId, orgId, supervisorId, studentId, quizId, 'seeded'],
          transaction,
        }
      );

      await transaction.commit();

      return {
        id: sessionId,
        org_id: orgId,
        supervisor_user_id: supervisorId,
        student_user_id: studentId,
        first_quiz_id: quizId,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get onboarding status
   */
  async getOnboardingStatus(id: string): Promise<OnboardingStatus | null> {
    const rows = await sequelize.query<{
      id: string;
      step: 'created' | 'seeded' | 'complete';
    }>('SELECT id, step FROM onboarding_sessions WHERE id = ?', {
      replacements: [id],
      type: QueryTypes.SELECT,
    });

    if (!rows || rows.length === 0) {
      return null;
    }

    const session = rows[0];
    const next: string[] = [];

    // Determine next steps based on current step
    if (session.step === 'created') {
      next.push('seed');
    } else if (session.step === 'seeded') {
      next.push('complete_quiz', 'explore_dashboard');
    }

    return {
      id: session.id,
      step: session.step,
      next,
    };
  }
}
