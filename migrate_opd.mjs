import https from 'https';

const PROJECT_REF = 'gskzafarbzhdcgvrrkdc';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdza3phZmFyYnpoZGNndnJya2RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA4NDAzMiwiZXhwIjoyMDgyNjYwMDMyfQ.Dou0kR2REzV3CdRpHfBBD-XDrE2opZ7FfXXVOzOM0Vs';

function request(method, hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const options = { hostname, path, method, headers };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Try Supabase management API SQL endpoint
const body = JSON.stringify({
  query: `ALTER TABLE public.opd_schedule ADD COLUMN IF NOT EXISTS general_opd_slots JSONB DEFAULT '[]'; ALTER TABLE public.opd_schedule ADD COLUMN IF NOT EXISTS private_opd_slots JSONB DEFAULT '[]'; ALTER TABLE public.opd_schedule ADD COLUMN IF NOT EXISTS general_slot_duration_minutes INTEGER; ALTER TABLE public.opd_schedule ADD COLUMN IF NOT EXISTS private_slot_duration_minutes INTEGER;`
});

// Try the pg endpoint via Supabase's direct db connection proxy
const res = await request(
  'POST',
  'api.supabase.com',
  `/v1/projects/${PROJECT_REF}/database/query`,
  {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Length': Buffer.byteLength(body),
  },
  body
);
console.log(`Status: ${res.status}`);
console.log(`Body: ${res.body.substring(0, 500)}`);
