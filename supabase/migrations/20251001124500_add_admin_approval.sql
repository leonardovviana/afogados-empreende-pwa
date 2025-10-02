alter table admin_profiles
  add column if not exists email text,
  add column if not exists is_approved boolean default false;

update admin_profiles
set is_approved = true
where is_approved is null;
