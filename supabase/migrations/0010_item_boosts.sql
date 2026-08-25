-- Destacar publicación: el dueño paga para que su objeto aparezca primero
-- en el feed durante un tiempo limitado.
alter table items
  add column if not exists featured_until timestamptz;

create index if not exists items_featured_until_idx on items(featured_until);

-- Registro de pagos (por ahora solo PayPal) asociados a destacar una
-- publicación. Sirve de auditoría y para no featurear dos veces la misma
-- orden si el usuario recarga la página de retorno.
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  provider text not null default 'paypal',
  provider_order_id text not null unique,
  purpose text not null default 'featured_listing',
  amount numeric not null,
  currency text not null default 'USD',
  status text not null default 'created'
    check (status in ('created', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists payments_item_id_idx on payments(item_id);

alter table payments enable row level security;

create policy "payments_select_own" on payments for select
  using (user_id = auth.uid());
create policy "payments_insert_own" on payments for insert
  with check (user_id = auth.uid());
create policy "payments_update_own" on payments for update
  using (user_id = auth.uid());
