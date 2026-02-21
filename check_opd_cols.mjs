import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://gskzafarbzhdcgvrrkdc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdza3phZmFyYnpoZGNndnJya2RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA4NDAzMiwiZXhwIjoyMDgyNjYwMDMyfQ.Dou0kR2REzV3CdRpHfBBD-XDrE2opZ7FfXXVOzOM0Vs'
);

const { data, error } = await sb.from('opd_schedule').select('*').limit(1);
if (error) {
  console.log('ERROR:', JSON.stringify(error));
} else {
  console.log('COLUMNS:', Object.keys(data[0] || {}));
  console.log('SAMPLE:', JSON.stringify(data[0]));
}
