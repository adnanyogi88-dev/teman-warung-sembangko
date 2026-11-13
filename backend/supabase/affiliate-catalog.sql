-- Affiliate catalog: admin-managed products/services and affiliate-specific links.
create table if not exists public.affiliate_catalog_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('product','service')),
  title text not null check (char_length(trim(title)) between 2 and 160),
  description text not null default '' check (char_length(description) <= 3000),
  stock integer not null default 0 check (stock >= 0),
  image_url text not null default '',
  destination_url text not null check (destination_url ~* '^https?://'),
  commission_type text not null default 'fixed' check (commission_type in ('fixed','percent')),
  commission_value numeric(14,2) not null default 0 check (commission_value >= 0 and (commission_type <> 'percent' or commission_value <= 100)),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists affiliate_catalog_items_status_type_idx
  on public.affiliate_catalog_items(status,item_type,created_at desc);
alter table public.affiliate_catalog_items enable row level security;
revoke all on public.affiliate_catalog_items from anon, authenticated;
grant select on public.affiliate_catalog_items to authenticated;
grant insert, update, delete on public.affiliate_catalog_items to authenticated;
drop policy if exists "affiliate catalog visible items" on public.affiliate_catalog_items;
create policy "affiliate catalog visible items" on public.affiliate_catalog_items
  for select to authenticated using (status = 'active' or public.is_admin());
drop policy if exists "admin manages affiliate catalog" on public.affiliate_catalog_items;
create policy "admin manages affiliate catalog" on public.affiliate_catalog_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.affiliate_item_links (
  id uuid primary key default gen_random_uuid(),
  catalog_item_id uuid not null references public.affiliate_catalog_items(id) on delete cascade,
  affiliate_user_id uuid not null references public.affiliate_accounts(user_id) on delete cascade,
  affiliate_url text not null check (affiliate_url ~* '^https?://'),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(catalog_item_id,affiliate_user_id)
);
create index if not exists affiliate_item_links_user_idx
  on public.affiliate_item_links(affiliate_user_id,created_at desc);
alter table public.affiliate_item_links enable row level security;
revoke all on public.affiliate_item_links from anon, authenticated;
grant select, insert on public.affiliate_item_links to authenticated;
grant update on public.affiliate_item_links to authenticated;
drop policy if exists "affiliate reads own item links or admin" on public.affiliate_item_links;
create policy "affiliate reads own item links or admin" on public.affiliate_item_links
  for select to authenticated using (affiliate_user_id = auth.uid() or public.is_admin());
drop policy if exists "affiliate submits own item link" on public.affiliate_item_links;
create policy "affiliate submits own item link" on public.affiliate_item_links
  for insert to authenticated with check (
    affiliate_user_id = auth.uid()
    and exists (select 1 from public.affiliate_accounts a where a.user_id = auth.uid() and a.status = 'active')
    and exists (select 1 from public.affiliate_catalog_items c where c.id = catalog_item_id and c.status = 'active')
  );
drop policy if exists "admin reviews affiliate item links" on public.affiliate_item_links;
create policy "admin reviews affiliate item links" on public.affiliate_item_links
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admin can change the review state; affiliates cannot modify submitted URLs or review state.
revoke update on public.affiliate_item_links from authenticated;
grant update (status, admin_note, reviewed_at) on public.affiliate_item_links to authenticated;

-- Safe upgrade for projects where the catalog table was created before stock was added.
alter table public.affiliate_catalog_items add column if not exists stock integer not null default 0 check (stock >= 0);

-- Public product photos; only admins may upload, replace, or delete files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product photos are publicly readable" on storage.objects;
create policy "product photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "admins upload product photos" on storage.objects;
create policy "admins upload product photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins update product photos" on storage.objects;
create policy "admins update product photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admins delete product photos" on storage.objects;
create policy "admins delete product photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
