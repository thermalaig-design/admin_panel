import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const PROJECT_REF = 'gskzafarbzhdcgvrrkdc';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = `
ALTER TABLE public.opd_schedule 
ADD COLUMN IF NOT EXISTS general_opd_schedule jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS private_opd_schedule jsonb DEFAULT '[]'::jsonb;
`;

const res = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/`, {
  method: 'POST',
  headers: {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

console.log('Status:', res.status);
console.log('Body:', await res.text());
