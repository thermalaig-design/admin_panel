-- Gallery Photos table (metadata) for uploaded images
-- Storage bucket: 'gallery' (already used in frontend)
-- This table stores public URL/path + optional user info.

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null default 'gallery',
  storage_path text not null, -- e.g. 'gallery/1700000000000_myphoto.jpg'
  public_url text not null,
  original_name text,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid null,
  folder_id uuid null,
  folder_name text null,
  phone_number text null,
  created_at timestamptz not null default now()
);

create index if not exists gallery_photos_created_at_idx
  on public.gallery_photos (created_at desc);

create index if not exists gallery_photos_uploaded_by_idx
  on public.gallery_photos (uploaded_by);

create index if not exists gallery_photos_folder_id_idx
  on public.gallery_photos (folder_id);

-- Enable Row Level Security (recommended)
alter table public.gallery_photos enable row level security;

-- Policies (simple defaults)
-- Anyone (anon/auth) can read gallery photos (public gallery)
drop policy if exists "gallery_photos_read_all" on public.gallery_photos;
create policy "gallery_photos_read_all"
  on public.gallery_photos
  for select
  using (true);

-- Only authenticated users can insert their uploads
drop policy if exists "gallery_photos_insert_auth" on public.gallery_photos;
create policy "gallery_photos_insert_auth"
  on public.gallery_photos
  for insert
  to authenticated
  with check (true);

-- Only uploader can delete their own rows (optional)
drop policy if exists "gallery_photos_delete_own" on public.gallery_photos;
create policy "gallery_photos_delete_own"
  on public.gallery_photos
  for delete
  to authenticated
  using (uploaded_by = auth.uid());

