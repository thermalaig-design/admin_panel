-- Gallery Folders: Admin can create folders and organize photos
-- Run this AFTER create_gallery_photos_table.sql

-- 1. Create gallery_folders table
create table if not exists public.gallery_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid null
);

create unique index if not exists gallery_folders_name_idx on public.gallery_folders (lower(name));
create index if not exists gallery_folders_created_at_idx on public.gallery_folders (created_at desc);

-- 2. Add folder_id to gallery_photos
alter table public.gallery_photos add column if not exists folder_id uuid references public.gallery_folders(id) on delete cascade;

create index if not exists gallery_photos_folder_id_idx on public.gallery_photos (folder_id);

-- 3. RLS for gallery_folders
alter table public.gallery_folders enable row level security;

drop policy if exists "gallery_folders_read_all" on public.gallery_folders;
create policy "gallery_folders_read_all"
  on public.gallery_folders for select using (true);

drop policy if exists "gallery_folders_insert_auth" on public.gallery_folders;
create policy "gallery_folders_insert_auth"
  on public.gallery_folders for insert to authenticated with check (true);

drop policy if exists "gallery_folders_update_auth" on public.gallery_folders;
create policy "gallery_folders_update_auth"
  on public.gallery_folders for update to authenticated using (true);

drop policy if exists "gallery_folders_delete_auth" on public.gallery_folders;
create policy "gallery_folders_delete_auth"
  on public.gallery_folders for delete to authenticated using (true);
