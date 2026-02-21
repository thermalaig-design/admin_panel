import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://gskzafarbzhdcgvrrkdc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdza3phZmFyYnpoZGNndnJya2RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA4NDAzMiwiZXhwIjoyMDgyNjYwMDMyfQ.Dou0kR2REzV3CdRpHfBBD-XDrE2opZ7FfXXVOzOM0Vs'
);

// Try to update a row with new columns to see what error we get
const { data, error } = await sb
  .from('opd_schedule')
  .update({ general_opd_slots: [], private_opd_slots: [], general_slot_duration_minutes: 15, private_slot_duration_minutes: 15 })
  .eq('id', 1)
  .select();

console.log('data:', JSON.stringify(data));
console.log('error:', JSON.stringify(error));
