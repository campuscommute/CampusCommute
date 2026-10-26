-- ============================================================
--  MIGRATION: support_tickets
--  Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ── Support tickets table ─────────────────────────────────────────────────────
create table if not exists public.support_tickets (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete set null,
  name          text not null,
  email         text,
  phone         text,
  category      text not null check (category in (
                  'Booking Issue',
                  'Payment Issue',
                  'Driver Complaint',
                  'Account Problem',
                  'Verification Help',
                  'Safety Concern',
                  'App Bug',
                  'Other'
                )),
  subject       text not null,
  message       text not null check (char_length(message) between 10 and 2000),
  status        text not null default 'open'
                  check (status in ('open','in_progress','resolved','closed')),
  priority      text not null default 'normal'
                  check (priority in ('low','normal','high','urgent')),
  admin_reply   text,
  replied_by    uuid references public.profiles(id) on delete set null,
  replied_at    timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Updated-at trigger
drop trigger if exists support_tickets_updated_at on public.support_tickets;
create trigger support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

-- Indexes
create index if not exists support_tickets_user_idx   on public.support_tickets(user_id);
create index if not exists support_tickets_status_idx on public.support_tickets(status);
create index if not exists support_tickets_created_idx on public.support_tickets(created_at desc);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.support_tickets enable row level security;

-- Drop old policies if re-running
drop policy if exists "tickets_select_own"   on public.support_tickets;
drop policy if exists "tickets_insert_any"   on public.support_tickets;
drop policy if exists "tickets_update_own"   on public.support_tickets;
drop policy if exists "tickets_admin_all"    on public.support_tickets;

-- Any authenticated user can view their own tickets
create policy "tickets_select_own"
  on public.support_tickets for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where (id = auth.uid() or auth_id = auth.uid()) and id = user_id)
  );

-- Any authenticated or anonymous user can submit a ticket
create policy "tickets_insert_any"
  on public.support_tickets for insert
  with check (true);

-- User can update their own ticket (e.g. add more info)
create policy "tickets_update_own"
  on public.support_tickets for update
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where (id = auth.uid() or auth_id = auth.uid()) and id = user_id)
  );

-- Admins can do everything
create policy "tickets_admin_all"
  on public.support_tickets for all
  using (
    exists (select 1 from public.profiles where (id = auth.uid() or auth_id = auth.uid()) and role = 'admin')
  );

-- ── Verify it worked ─────────────────────────────────────────────────────────
-- select count(*) from public.support_tickets;
