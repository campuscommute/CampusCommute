-- ============================================================
--  CAMPUS COMMUTE — Supabase Schema  (idempotent, safe to re-run)
--  Supabase Dashboard → SQL Editor → New Query → Run
--
--  ✅ ONE-TIME SETUP BEFORE RUNNING:
--     Authentication → Providers → Email → "Confirm email" → OFF → Save
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
--  SHARED FUNCTIONS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, phone, gender, college)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'real_email', new.email),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'college'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ============================================================
--  PROFILES
-- ============================================================

create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  name                text not null,
  phone               text unique,
  email               text unique,
  college             text,
  enrollment_no       text,
  gender              text check (gender in ('male','female','other')),
  role                text not null default 'student' check (role in ('student','admin')),
  avatar_url          text,
  pin_hash            text,                        -- base64(pin:phone), used for sign-in verification
  auth_id             uuid,                        -- anon session uid for returning users on new devices
  is_verified         boolean not null default false,
  verification_status text not null default 'unsubmitted'
                        check (verification_status in
                          ('unsubmitted','pending','approved','rejected')),
  college_id_url      text,
  selfie_url          text,
  verified_at         timestamptz,
  rating              numeric(3,2) default 0,
  total_rides         int default 0,
  total_reviews       int default 0,
  preferences         jsonb default
                        '{"womenOnly":false,"notifications":true,"rideUpdates":true}'::jsonb,
  emergency_contact   jsonb default '{}'::jsonb,
  saved_routes        jsonb default '[]'::jsonb,
  is_active           boolean default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
--  RIDES
-- ============================================================

create table if not exists public.rides (
  id              uuid primary key default uuid_generate_v4(),
  driver_id       uuid not null references public.profiles(id) on delete cascade,
  from_label      text not null,
  from_lat        numeric,
  from_lng        numeric,
  to_label        text not null,
  to_lat          numeric,
  to_lng          numeric,
  date            date not null,
  time            text not null,
  total_seats     int not null check (total_seats between 1 and 6),
  available_seats int not null check (available_seats >= 0),
  price_per_seat  numeric(8,2) not null check (price_per_seat >= 0),
  preference      text not null default 'everyone'
                    check (preference in ('everyone','women-only')),
  is_recurring    boolean default false,
  recurring_days  text[] default '{}',
  vehicle_model   text,
  vehicle_color   text,
  vehicle_plate   text,
  status          text not null default 'upcoming'
                    check (status in ('upcoming','active','completed','cancelled')),
  started_at      timestamptz,
  completed_at    timestamptz,
  current_lat     numeric,
  current_lng     numeric,
  location_updated_at timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

drop trigger if exists rides_updated_at on public.rides;
create trigger rides_updated_at
  before update on public.rides
  for each row execute function public.set_updated_at();

create index if not exists rides_driver_idx on public.rides(driver_id);
create index if not exists rides_status_idx on public.rides(status, date);
create index if not exists rides_pref_idx   on public.rides(preference);

-- ============================================================
--  BOOKINGS
-- ============================================================

create table if not exists public.bookings (
  id                   uuid primary key default uuid_generate_v4(),
  ride_id              uuid not null references public.rides(id) on delete cascade,
  passenger_id         uuid not null references public.profiles(id) on delete cascade,
  seats_booked         int not null default 1 check (seats_booked between 1 and 4),
  total_amount         numeric(8,2) not null,
  original_price       numeric(8,2),
  offered_price        numeric(8,2),
  counter_offer_status text default 'none'
                         check (counter_offer_status in
                           ('none','pending','accepted','rejected')),
  otp                  text,
  otp_verified         boolean default false,
  otp_verified_at      timestamptz,
  status               text not null default 'pending'
                         check (status in
                           ('pending','confirmed','active','completed','cancelled')),
  cancelled_by         text check (cancelled_by in ('passenger','driver','admin')),
  cancellation_reason  text,
  cancelled_at         timestamptz,
  passenger_rating     int check (passenger_rating between 1 and 5),
  passenger_comment    text,
  driver_rating        int check (driver_rating between 1 and 5),
  driver_comment       text,
  rated_at             timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),
  unique(ride_id, passenger_id)
);

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create index if not exists bookings_passenger_idx on public.bookings(passenger_id);
create index if not exists bookings_ride_idx      on public.bookings(ride_id);
create index if not exists bookings_status_idx    on public.bookings(status);

-- ============================================================
--  REPORTS
-- ============================================================

create table if not exists public.reports (
  id               uuid primary key default uuid_generate_v4(),
  reporter_id      uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  ride_id          uuid references public.rides(id) on delete set null,
  booking_id       uuid references public.bookings(id) on delete set null,
  type             text not null check (type in (
                     'Late Pickup','No Show','Unsafe Driving','Route Change',
                     'Harassment','Wrong Vehicle','OTP Fraud','Other')),
  description      text not null,
  status           text not null default 'open'
                     check (status in
                       ('open','reviewing','resolved','escalated','dismissed')),
  resolution       text,
  resolved_by      uuid references public.profiles(id),
  resolved_at      timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- ============================================================
--  STORAGE BUCKET
-- ============================================================

insert into storage.buckets (id, name, public)
values ('campus-commute', 'campus-commute', false)
on conflict (id) do nothing;

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.rides     enable row level security;
alter table public.bookings  enable row level security;
alter table public.reports   enable row level security;

-- Drop all existing policies first (idempotent)
do $$ declare pol record;
begin
  for pol in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','rides','bookings','reports')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      pol.policyname, pol.tablename
    );
  end loop;
end $$;

drop policy if exists "storage_insert_auth"  on storage.objects;
drop policy if exists "storage_select_own"   on storage.objects;
drop policy if exists "storage_admin_select" on storage.objects;

-- ── profiles ──────────────────────────────────────────────────────────────────
-- Anyone (including anon) can read profiles
create policy "profiles_select_all"
  on public.profiles for select using (true);

-- Any authenticated user (including anonymous) can insert their own profile
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile (by id or auth_id for returning users on new device)
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id or auth.uid() = auth_id);

-- Admins: use jwt claim to avoid infinite recursion
create policy "profiles_admin_all"
  on public.profiles for all
  using (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    or coalesce((auth.jwt() ->> 'role'), '') = 'admin'
  );

-- ── rides ─────────────────────────────────────────────────────────────────────
create policy "rides_select_all"
  on public.rides for select using (true);

create policy "rides_insert_verified"
  on public.rides for insert
  with check (
    auth.uid() = driver_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_verified = true
    )
  );

create policy "rides_update_driver"
  on public.rides for update using (auth.uid() = driver_id);

create policy "rides_delete_driver"
  on public.rides for delete using (auth.uid() = driver_id);

create policy "rides_admin_all"
  on public.rides for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ── bookings ──────────────────────────────────────────────────────────────────
create policy "bookings_select_parties"
  on public.bookings for select
  using (
    auth.uid() = passenger_id
    or auth.uid() = (select driver_id from public.rides where id = ride_id)
  );

create policy "bookings_insert_verified"
  on public.bookings for insert
  with check (
    auth.uid() = passenger_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_verified = true
    )
  );

create policy "bookings_update_parties"
  on public.bookings for update
  using (
    auth.uid() = passenger_id
    or auth.uid() = (select driver_id from public.rides where id = ride_id)
  );

create policy "bookings_admin_all"
  on public.bookings for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ── reports ───────────────────────────────────────────────────────────────────
create policy "reports_select_own"
  on public.reports for select using (auth.uid() = reporter_id);

create policy "reports_insert_auth"
  on public.reports for insert with check (auth.uid() = reporter_id);

create policy "reports_admin_all"
  on public.reports for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ── storage ───────────────────────────────────────────────────────────────────
create policy "storage_insert_auth"
  on storage.objects for insert
  with check (
    bucket_id = 'campus-commute'
    and auth.role() = 'authenticated'
  );

create policy "storage_select_own"
  on storage.objects for select
  using (
    bucket_id = 'campus-commute'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "storage_admin_select"
  on storage.objects for select
  using (
    bucket_id = 'campus-commute'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
--  MESSAGES
-- ============================================================

create table if not exists public.messages (
  id           uuid primary key default uuid_generate_v4(),
  booking_id   uuid references public.bookings(id) on delete cascade,
  sender_id    uuid not null references public.profiles(id) on delete cascade,
  receiver_id  uuid not null references public.profiles(id) on delete cascade,
  content      text not null check (char_length(content) between 1 and 1000),
  read         boolean default false,
  created_at   timestamptz default now()
);

create index if not exists messages_booking_idx  on public.messages(booking_id);
create index if not exists messages_sender_idx   on public.messages(sender_id);
create index if not exists messages_receiver_idx on public.messages(receiver_id);
create index if not exists messages_created_idx  on public.messages(created_at desc);

alter table public.messages enable row level security;

create policy "messages_select_parties"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "messages_insert_own"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "messages_update_receiver"
  on public.messages for update
  using (auth.uid() = receiver_id);

-- ============================================================
--  WOMEN-ONLY RIDES VIEW
-- ============================================================

create or replace view public.women_only_rides as
  select
    r.*,
    p.name        as driver_name,
    p.college     as driver_college,
    p.rating      as driver_rating,
    p.is_verified as driver_verified,
    p.avatar_url  as driver_avatar,
    p.gender      as driver_gender
  from public.rides r
  join public.profiles p on p.id = r.driver_id
  where r.preference      = 'women-only'
    and r.status          = 'upcoming'
    and r.available_seats > 0
    and p.gender          = 'female';

-- ============================================================
--  MAKE YOURSELF ADMIN
--  Run this separately after creating your account:
--  update public.profiles set role = 'admin' where phone = '9220612315';
-- ============================================================
