
create table if not exists public.gallery_photos (
  id uuid not null default gen_random_uuid(),
  storage_bucket text not null default 'gallery'::text,
  storage_path text not null,
  public_url text not null,
  original_name text null,
  mime_type text null,
  size_bytes bigint null,
  uploaded_by uuid null,
  created_at timestamp with time zone not null default now(),
  folder_name text null,
  constraint gallery_photos_pkey primary key (id)
) TABLESPACE pg_default;

create index if not exists gallery_photos_created_at_idx on public.gallery_photos using btree (created_at desc) TABLESPACE pg_default;

create index if not exists gallery_photos_uploaded_by_idx on public.gallery_photos using btree (uploaded_by) TABLESPACE pg_default;

create index if not exists gallery_photos_folder_name_idx on public.gallery_photos using btree (folder_name) TABLESPACE pg_default;

-- If gallery_photos already exists, just add folder_name:
-- alter table public.gallery_photos add column if not exists folder_name text null;
