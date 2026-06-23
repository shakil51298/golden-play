    -- Banner publish fix for the demo admin panel.
    -- Run this in Supabase SQL Editor if Save/Publish shows:
    -- "new row violates row-level security policy for table banners"
    --
    -- This project uses a mock in-app admin role, not Supabase Auth roles.
    -- For this demo to publish banners from the browser with the anon key,
    -- the banners table must allow public read and demo write access.

    grant usage on schema public to anon, authenticated;
    grant select, insert, update, delete on table public.banners to anon, authenticated;

    alter table public.banners enable row level security;

    drop policy if exists "Demo public read banners" on public.banners;
    create policy "Demo public read banners"
    on public.banners
    for select
    to anon, authenticated
    using (true);

    drop policy if exists "Demo admin publish banners" on public.banners;
    create policy "Demo admin publish banners"
    on public.banners
    for insert
    to anon, authenticated
    with check (true);

    drop policy if exists "Demo admin update banners" on public.banners;
    create policy "Demo admin update banners"
    on public.banners
    for update
    to anon, authenticated
    using (true)
    with check (true);

    drop policy if exists "Demo admin delete banners" on public.banners;
    create policy "Demo admin delete banners"
    on public.banners
    for delete
    to anon, authenticated
    using (true);
