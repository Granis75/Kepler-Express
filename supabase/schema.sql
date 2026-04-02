create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('admin', 'manager', 'accountant', 'driver');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_status as enum ('active', 'inactive', 'invited');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.client_status as enum ('active', 'inactive', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.mission_status as enum ('planned', 'assigned', 'in_progress', 'delivered', 'issue', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.expense_type as enum ('fuel', 'tolls', 'mission', 'maintenance', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.expense_approval_status as enum ('pending', 'approved', 'paid', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invoice_status as enum ('draft', 'sent', 'partial', 'paid', 'overdue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('bank_transfer', 'check', 'cash', 'card', 'other');
exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.organizations (
  organization_id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 150),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.profiles (
  profile_id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(organization_id) on delete cascade,
  role public.user_role not null default 'manager',
  name text not null check (char_length(btrim(name)) between 2 and 150),
  email text not null,
  phone text,
  status public.user_status not null default 'active',
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.clients (
  client_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(organization_id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 150),
  email text not null,
  phone text not null,
  address text,
  city text,
  postal_code text,
  country text not null default 'FR',
  vat_number text,
  status public.client_status not null default 'active',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint clients_org_email_unique unique (organization_id, email)
);

create table public.missions (
  mission_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(organization_id) on delete cascade,
  client_id uuid not null references public.clients(client_id) on delete restrict,
  reference text not null,
  status public.mission_status not null default 'planned',
  driver_name text,
  vehicle_name text,
  revenue_amount numeric(12,2) not null check (revenue_amount >= 50 and revenue_amount <= 10000),
  estimated_cost_amount numeric(12,2) not null default 0 check (estimated_cost_amount >= 0),
  actual_cost_amount numeric(12,2) not null default 0 check (actual_cost_amount >= 0),
  departure_location text not null,
  arrival_location text not null,
  departure_datetime timestamptz not null,
  arrival_datetime timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint missions_org_reference_unique unique (organization_id, reference),
  constraint missions_cost_vs_revenue check (estimated_cost_amount <= revenue_amount),
  constraint missions_departure_arrival check (departure_location <> arrival_location),
  constraint missions_arrival_after_departure check (arrival_datetime is null or arrival_datetime >= departure_datetime)
);

create table public.expenses (
  expense_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(organization_id) on delete cascade,
  mission_id uuid references public.missions(mission_id) on delete set null,
  driver_name text,
  vehicle_name text,
  expense_type public.expense_type not null,
  amount numeric(12,2) not null check (amount > 0 and amount <= 5000),
  advanced_by_driver boolean not null default false,
  approval_status public.expense_approval_status not null default 'pending',
  receipt_url text,
  receipt_present boolean not null default false,
  expense_date date not null default current_date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.invoices (
  invoice_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(organization_id) on delete cascade,
  client_id uuid not null references public.clients(client_id) on delete restrict,
  invoice_number text not null,
  mission_ids uuid[] not null default '{}',
  amount_total numeric(12,2) not null check (amount_total >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  status public.invoice_status not null default 'draft',
  issue_date date not null default current_date,
  due_date date not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint invoices_org_invoice_number_unique unique (organization_id, invoice_number),
  constraint invoices_paid_le_total check (amount_paid <= amount_total),
  constraint invoices_due_after_issue check (due_date >= issue_date),
  constraint invoices_has_missions check (cardinality(mission_ids) > 0)
);

create table public.payments (
  payment_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(organization_id) on delete cascade,
  invoice_id uuid not null references public.invoices(invoice_id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method public.payment_method not null default 'bank_transfer',
  payment_date date not null default current_date,
  reference text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index idx_profiles_organization_id on public.profiles(organization_id);
create index idx_clients_organization_id on public.clients(organization_id);
create index idx_clients_name on public.clients(name);
create index idx_missions_organization_id on public.missions(organization_id);
create index idx_missions_client_id on public.missions(client_id);
create index idx_missions_status on public.missions(status);
create index idx_missions_departure_datetime on public.missions(departure_datetime);
create index idx_expenses_organization_id on public.expenses(organization_id);
create index idx_expenses_mission_id on public.expenses(mission_id);
create index idx_expenses_expense_date on public.expenses(expense_date);
create index idx_expenses_approval_status on public.expenses(approval_status);
create index idx_invoices_organization_id on public.invoices(organization_id);
create index idx_invoices_client_id on public.invoices(client_id);
create index idx_invoices_due_date on public.invoices(due_date);
create index idx_invoices_status on public.invoices(status);
create index idx_payments_organization_id on public.payments(organization_id);
create index idx_payments_invoice_id on public.payments(invoice_id);
create index idx_payments_payment_date on public.payments(payment_date);

drop trigger if exists set_updated_at_organizations on public.organizations;
create trigger set_updated_at_organizations
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_clients on public.clients;
create trigger set_updated_at_clients
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_missions on public.missions;
create trigger set_updated_at_missions
before update on public.missions
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_expenses on public.expenses;
create trigger set_updated_at_expenses
before update on public.expenses
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_invoices on public.invoices;
create trigger set_updated_at_invoices
before update on public.invoices
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_payments on public.payments;
create trigger set_updated_at_payments
before update on public.payments
for each row execute function public.set_updated_at();

create or replace function public.recalculate_mission_actual_cost(p_mission_id uuid)
returns void
language plpgsql
as $$
begin
  update public.missions
  set actual_cost_amount = coalesce((
    select sum(e.amount)
    from public.expenses e
    where e.mission_id = p_mission_id
  ), 0)
  where mission_id = p_mission_id;
end;
$$;

create or replace function public.handle_expense_cost_sync()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.mission_id is not null then
      perform public.recalculate_mission_actual_cost(old.mission_id);
    end if;
    return old;
  end if;

  if new.mission_id is not null then
    perform public.recalculate_mission_actual_cost(new.mission_id);
  end if;

  if tg_op = 'UPDATE' and old.mission_id is distinct from new.mission_id and old.mission_id is not null then
    perform public.recalculate_mission_actual_cost(old.mission_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_expense_cost_sync on public.expenses;
create trigger trg_expense_cost_sync
after insert or update or delete on public.expenses
for each row execute function public.handle_expense_cost_sync();

create or replace function public.validate_invoice_mission_scope()
returns trigger
language plpgsql
as $$
declare
  invalid_count integer;
begin
  select count(*)
  into invalid_count
  from unnest(new.mission_ids) as mission_ref(mission_id)
  left join public.missions m on m.mission_id = mission_ref.mission_id
  where m.mission_id is null
     or m.organization_id <> new.organization_id
     or m.client_id <> new.client_id;

  if invalid_count > 0 then
    raise exception 'Invoice mission_ids must belong to the same organization and client';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_invoice_mission_scope on public.invoices;
create trigger trg_validate_invoice_mission_scope
before insert or update on public.invoices
for each row execute function public.validate_invoice_mission_scope();

create or replace function public.recalculate_invoice_amount_paid_and_status(p_invoice_id uuid)
returns void
language plpgsql
as $$
declare
  v_amount_total numeric(12,2);
  v_amount_paid numeric(12,2);
  v_due_date date;
  v_current_status public.invoice_status;
  v_next_status public.invoice_status;
begin
  select
    i.amount_total,
    i.due_date,
    i.status,
    coalesce(sum(p.amount), 0)
  into
    v_amount_total,
    v_due_date,
    v_current_status,
    v_amount_paid
  from public.invoices i
  left join public.payments p on p.invoice_id = i.invoice_id
  where i.invoice_id = p_invoice_id
  group by i.invoice_id;

  if not found then
    return;
  end if;

  if v_amount_paid >= v_amount_total and v_amount_total > 0 then
    v_next_status := 'paid';
  elsif v_amount_paid > 0 then
    v_next_status := 'partial';
  elsif v_current_status = 'draft' then
    v_next_status := 'draft';
  elsif v_due_date < current_date then
    v_next_status := 'overdue';
  else
    v_next_status := 'sent';
  end if;

  update public.invoices
  set amount_paid = v_amount_paid,
      status = v_next_status
  where invoice_id = p_invoice_id;
end;
$$;

create or replace function public.handle_payment_invoice_sync()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_invoice_amount_paid_and_status(old.invoice_id);
    return old;
  end if;

  perform public.recalculate_invoice_amount_paid_and_status(new.invoice_id);

  if tg_op = 'UPDATE' and old.invoice_id is distinct from new.invoice_id then
    perform public.recalculate_invoice_amount_paid_and_status(old.invoice_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_payment_invoice_sync on public.payments;
create trigger trg_payment_invoice_sync
after insert or update or delete on public.payments
for each row execute function public.handle_payment_invoice_sync();

create or replace function public.validate_payment_amount()
returns trigger
language plpgsql
as $$
declare
  v_invoice_total numeric(12,2);
  v_other_payments numeric(12,2);
begin
  select amount_total
  into v_invoice_total
  from public.invoices
  where invoice_id = new.invoice_id
  for update;

  if v_invoice_total is null then
    raise exception 'Invoice not found for payment';
  end if;

  select coalesce(sum(amount), 0)
  into v_other_payments
  from public.payments
  where invoice_id = new.invoice_id
    and payment_id <> coalesce(new.payment_id, '00000000-0000-0000-0000-000000000000'::uuid);

  if v_other_payments + new.amount > v_invoice_total then
    raise exception 'Payment exceeds remaining invoice balance';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_payment_amount on public.payments;
create trigger trg_validate_payment_amount
before insert or update on public.payments
for each row execute function public.validate_payment_amount();

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id
  from public.profiles p
  where p.user_id = auth.uid()
  limit 1
$$;

revoke all on function public.current_organization_id() from public;
grant execute on function public.current_organization_id() to authenticated;

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function public.handle_new_user_bootstrap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_name text;
  v_profile_name text;
  v_phone text;
  v_org_slug text;
  v_org_id uuid;
begin
  v_org_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'organization_name', '')), '');
  v_profile_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  v_phone := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');

  if v_org_name is null then
    v_org_name := coalesce(split_part(new.email, '@', 1), 'workspace');
  end if;

  if v_profile_name is null then
    v_profile_name := coalesce(split_part(new.email, '@', 1), 'Workspace Admin');
  end if;

  v_org_slug := public.slugify(v_org_name);

  if v_org_slug = '' then
    v_org_slug := 'workspace';
  end if;

  v_org_slug := left(v_org_slug, 42) || '-' || substring(new.id::text from 1 for 8);

  insert into public.organizations (name, slug)
  values (v_org_name, v_org_slug)
  returning organization_id into v_org_id;

  insert into public.profiles (
    user_id,
    organization_id,
    role,
    name,
    email,
    phone,
    status
  )
  values (
    new.id,
    v_org_id,
    'admin',
    v_profile_name,
    coalesce(new.email, ''),
    v_phone,
    'active'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user_bootstrap();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.missions enable row level security;
alter table public.expenses enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;

drop policy if exists organizations_select_own_org on public.organizations;
create policy organizations_select_own_org
on public.organizations
for select
to authenticated
using (organization_id = public.current_organization_id());

drop policy if exists profiles_select_own_org on public.profiles;
create policy profiles_select_own_org
on public.profiles
for select
to authenticated
using (organization_id = public.current_organization_id());

drop policy if exists profiles_update_own_row on public.profiles;
create policy profiles_update_own_row
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and organization_id = public.current_organization_id()
);

drop policy if exists clients_org_access on public.clients;
create policy clients_org_access
on public.clients
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

drop policy if exists missions_org_access on public.missions;
create policy missions_org_access
on public.missions
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

drop policy if exists expenses_org_access on public.expenses;
create policy expenses_org_access
on public.expenses
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

drop policy if exists invoices_org_access on public.invoices;
create policy invoices_org_access
on public.invoices
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

drop policy if exists payments_org_access on public.payments;
create policy payments_org_access
on public.payments
for all
to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());
