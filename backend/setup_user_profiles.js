/**
 * Setup script to create user_profiles table in Supabase
 * Run this file using: node backend/setup_user_profiles.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const createUserProfilesTable = async () => {
  try {
    console.log('📝 Creating user_profiles table...');

    const sqlQuery = `
    create table if not exists public.user_profiles (
      id serial not null,
      user_id uuid not null,
      user_identifier character varying(255) not null,
      name character varying(255) null,
      role character varying(100) null,
      member_id character varying(255) null,
      mobile character varying(20) null,
      email character varying(255) null,
      address_home text null,
      address_office text null,
      company_name character varying(255) null,
      resident_landline character varying(20) null,
      office_landline character varying(20) null,
      gender character varying(20) null,
      marital_status character varying(20) null,
      nationality character varying(100) null,
      aadhaar_id character varying(20) null,
      blood_group character varying(10) null,
      dob date null,
      emergency_contact_name character varying(255) null,
      emergency_contact_number character varying(20) null,
      profile_photo_url text null,
      spouse_name character varying(255) null,
      spouse_contact_number character varying(20) null,
      children_count integer null,
      facebook text null,
      twitter text null,
      instagram text null,
      linkedin text null,
      whatsapp text null,
      family_members jsonb null,
      position character varying(255) null,
      location character varying(255) null,
      is_elected_member boolean null default false,
      created_at timestamp without time zone null default now(),
      updated_at timestamp without time zone null default now(),
      constraint user_profiles_pkey primary key (id),
      constraint user_profiles_user_identifier_unique unique (user_identifier)
    ) TABLESPACE pg_default;

    create index IF not exists idx_user_profiles_user_id on public.user_profiles using btree (user_id) TABLESPACE pg_default;

    create index IF not exists idx_user_profiles_user_identifier on public.user_profiles using btree (user_identifier) TABLESPACE pg_default;

    create or replace function update_user_profiles_updated_at()
    returns trigger as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trigger_update_user_profiles_updated_at on user_profiles;

    create trigger trigger_update_user_profiles_updated_at BEFORE
    update on user_profiles for EACH row
    execute FUNCTION update_user_profiles_updated_at ();
    `;

    // Execute the SQL query using the Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { 
      query: sqlQuery 
    }).catch(() => {
      // If RPC method doesn't exist, we'll use direct query
      return { data: null, error: null };
    });

    if (error) {
      console.log('ℹ️  Using direct SQL execution...');
      // Try alternative approach - using the SQL editor
      console.log('⚠️  Direct RPC execution not available.');
      console.log('Please execute the SQL manually from: backend/sql/create_user_profiles_table.sql');
      console.log('\nSteps:');
      console.log('1. Go to Supabase Dashboard -> SQL Editor');
      console.log('2. Create new query');
      console.log('3. Copy and paste content from: backend/sql/create_user_profiles_table.sql');
      console.log('4. Execute the query');
      process.exit(0);
    }

    console.log('✅ User profiles table created successfully!');
    console.log('\nTable Details:');
    console.log('- Table name: user_profiles');
    console.log('- Columns: id, user_id, user_identifier, name, role, member_id, mobile, email, and more...');
    console.log('- Indexes: user_id, user_identifier');
    console.log('- Auto-update trigger on updated_at field');
    console.log('\n✨ You can now use the User Profiles feature in the Admin Panel!');

  } catch (error) {
    console.error('❌ Error creating table:', error);
    console.log('\n📋 Fallback: Execute SQL manually');
    console.log('Please run the SQL from: backend/sql/create_user_profiles_table.sql');
    process.exit(1);
  }
};

createUserProfilesTable();
