-- Promotions publish fix for the demo admin panel.
-- Run this in Supabase SQL Editor if promo publishing shows:
-- "new row violates row-level security policy for table promotions"

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.promotions to anon, authenticated;

alter table public.promotions enable row level security;

drop policy if exists "Demo public read promotions" on public.promotions;
create policy "Demo public read promotions"
on public.promotions
for select
to anon, authenticated
using (true);

drop policy if exists "Demo admin publish promotions" on public.promotions;
create policy "Demo admin publish promotions"
on public.promotions
for insert
to anon, authenticated
with check (true);

drop policy if exists "Demo admin update promotions" on public.promotions;
create policy "Demo admin update promotions"
on public.promotions
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Demo admin delete promotions" on public.promotions;
create policy "Demo admin delete promotions"
on public.promotions
for delete
to anon, authenticated
using (true);
