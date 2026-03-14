import 'dotenv/config';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/e2426e2f-6eb8-4ea6-91af-e79e0dbac3a5', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Debug-Session-Id': '609d34',
  },
  body: JSON.stringify({
    sessionId: '609d34',
    runId: 'backend-env-init',
    hypothesisId: 'H1',
    location: 'backend/src/env.ts:1',
    message: 'Backend env.ts loaded',
    data: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion agent log

if (!process.env.DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set. Copy backend/.env.example to backend/.env and configure your database connection string.'
  );
  process.exit(1);
}

