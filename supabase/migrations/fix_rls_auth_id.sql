-- ============================================================
--  MIGRATION: fix_rls_auth_id
--  Run this in Supabase Dashboard → SQL Editor → New Query → Run
--
--  Problem: rides/bookings RLS policies only checked auth.uid() = driver_id
--  but the app uses profile.id as driver_id (a stable UUID), while
--  auth.uid() may be a different anon UID on new device logins.
--  The profiles table has an auth_id column to bridge these.
--
--  This migration replaces the broken policies with ones that check
--  BOTH auth.uid() = driver_id AND the auth_id bridge.
-- ============================================================

-- ── Drop old rides policies ───────────────────────────────────────────────────
drop policy if exists "rides_insert_verified"  on public.rides;
drop policy if exists "rides_insert_driver"    on public.rides;
drop policy if exists "rides_update_driver"    on public.rides;
drop policy if exists "rides_delete_driver"    on public.rides;

-- ── New rides policies ────────────────────────────────────────────────────────

-- Insert: auth session owns the driver profile (direct id or auth_id link)
create policy "rides_insert_driver"
  on public.rides for insert
  with check (
    auth.uid() = driver_id
    or exists (
      select 1 from public.profiles
      where id = driver_id
        and auth_id = auth.uid()
    )
  );

-- Update: same ownership check
create policy "rides_update_driver"
  on public.rides for update
  using (
    auth.uid() = driver_id
    or exists (
      select 1 from public.profiles
      where id = driver_id
        and auth_id = auth.uid()
    )
  );

-- Delete: same ownership check
create policy "rides_delete_driver"
  on public.rides for delete
  using (
    auth.uid() = driver_id
    or exists (
      select 1 from public.profiles
      where id = driver_id
        and auth_id = auth.uid()
    )
  );

-- ── Drop old bookings policies ────────────────────────────────────────────────
drop policy if exists "bookings_select_parties"  on public.bookings;
drop policy if exists "bookings_insert_verified" on public.bookings;
drop policy if exists "bookings_insert_passenger" on public.bookings;
drop policy if exists "bookings_update_parties"  on public.bookings;

-- ── New bookings policies ─────────────────────────────────────────────────────

-- Select: passenger or driver on the ride (both with auth_id bridge)
create policy "bookings_select_parties"
  on public.bookings for select
  using (
    -- passenger (direct or auth_id)
    auth.uid() = passenger_id
    or exists (
      select 1 from public.profiles
      where id = passenger_id and auth_id = auth.uid()
    )
    -- driver on the ride (direct or auth_id)
    or exists (
      select 1 from public.profiles
      where (id = auth.uid() or auth_id = auth.uid())
        and id = (select driver_id from public.rides where id = ride_id)
    )
  );

-- Insert: passenger owns the booking
create policy "bookings_insert_passenger"
  on public.bookings for insert
  with check (
    auth.uid() = passenger_id
    or exists (
      select 1 from public.profiles
      where id = passenger_id and auth_id = auth.uid()
    )
  );

-- Update: passenger or driver can update (e.g. OTP verify, cancel, complete)
create policy "bookings_update_parties"
  on public.bookings for update
  using (
    -- passenger
    auth.uid() = passenger_id
    or exists (
      select 1 from public.profiles
      where id = passenger_id and auth_id = auth.uid()
    )
    -- driver
    or exists (
      select 1 from public.profiles
      where (id = auth.uid() or auth_id = auth.uid())
        and id = (select driver_id from public.rides where id = ride_id)
    )
  );
