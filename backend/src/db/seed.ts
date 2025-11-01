import { sequelize } from './connection';
import { QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed canonical org + trial subscription for tests
 */

const CANON = {
  ORG: '11111111-1111-1111-1111-111111111111',
  SUP: '22222222-2222-2222-2222-222222222222',
  STU: '33333333-3333-3333-3333-333333333333',
};

async function seed() {
  // Check if canon org already exists
  const existing = await sequelize.query<{ id: string }>(
    'SELECT id FROM orgs WHERE id = ?',
    { replacements: [CANON.ORG], type: QueryTypes.SELECT }
  );

  if ((existing || []).length > 0) {
    console.log('Canon org already seeded, skipping.');
    return;
  }

  // Create canonical org
  await sequelize.query(
    'INSERT INTO orgs (id, name) VALUES (?, ?)',
    { replacements: [CANON.ORG, 'Canon Org'] }
  );
  console.log('✓ Created canon org');

  // Create canonical supervisor
  await sequelize.query(
    'INSERT INTO users (id, display_name, email) VALUES (?, ?, ?)',
    { replacements: [CANON.SUP, 'Canon Supervisor', 'supervisor@canon.test'] }
  );
  await sequelize.query(
    'INSERT INTO org_members (id, org_id, user_id, role) VALUES (?, ?, ?, ?)',
    { replacements: [uuidv4(), CANON.ORG, CANON.SUP, 'supervisor'] }
  );
  console.log('✓ Created canon supervisor');

  // Create canonical student
  await sequelize.query(
    'INSERT INTO users (id, display_name, email) VALUES (?, ?, ?)',
    { replacements: [CANON.STU, 'Canon Student', 'student@canon.test'] }
  );
  await sequelize.query(
    'INSERT INTO org_members (id, org_id, user_id, role) VALUES (?, ?, ?, ?)',
    { replacements: [uuidv4(), CANON.ORG, CANON.STU, 'student'] }
  );
  await sequelize.query(
    'INSERT INTO student_profiles (id, user_id, grade_level) VALUES (?, ?, ?)',
    { replacements: [uuidv4(), CANON.STU, 5] }
  );
  console.log('✓ Created canon student');

  // Create trial subscription
  const trialDays = parseInt(process.env.TRIAL_DAYS || '14', 10);
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

  await sequelize.query(
    'INSERT INTO subscriptions (id, org_id, plan_name, status, trial_ends_at) VALUES (?, ?, ?, ?, ?)',
    {
      replacements: [
        uuidv4(),
        CANON.ORG,
        process.env.PLAN_HOMESCHOOL_MONTHLY || 'homeschool_monthly',
        'trial',
        trialEndsAt,
      ],
    }
  );
  console.log('✓ Created trial subscription');

  console.log('Seed complete.');
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

export { seed };
