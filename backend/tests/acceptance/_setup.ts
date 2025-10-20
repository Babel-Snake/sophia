// Jest setup for acceptance tests
process.env.TZ = 'Australia/Adelaide';
process.env.REPORTS_PDF_ENABLED = process.env.REPORTS_PDF_ENABLED ?? 'true';
process.env.BILLING_ENABLED = process.env.BILLING_ENABLED ?? 'true';


// If tests spin up the app directly, export it from src/app. Otherwise, set BASE_URL.