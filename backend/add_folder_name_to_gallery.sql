-- Add folder_name column to gallery_photos
alter table public.gallery_photos add column if not exists folder_name text null;

create index if not exists gallery_photos_folder_name_idx on public.gallery_photos using btree (folder_name) TABLESPACE pg_default;
