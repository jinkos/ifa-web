/* Simple env guard to fail builds if required vars are missing */
require('dotenv').config();

const required = [
  'FASTAPI_URL',
  'BASE_URL'
];

const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');

if (missing.length) {
  console.error(`\n[env-check] Missing required env vars: ${missing.join(', ')}\n`);
  process.exit(1);
}

const fastapi = String(process.env.FASTAPI_URL);
if (fastapi.endsWith('/')) {
  console.warn('[env-check] FASTAPI_URL should not end with a trailing slash. It will be trimmed at runtime.');
}
