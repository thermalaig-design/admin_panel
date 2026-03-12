create table public.user_profiles (
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

-- Create trigger function for update_user_profiles_updated_at if it doesn't exist
create or replace function update_user_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger
create trigger trigger_update_user_profiles_updated_at BEFORE
update on user_profiles for EACH row
execute FUNCTION update_user_profiles_updated_at ();
