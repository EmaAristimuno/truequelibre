-- TruequeLibre — esquema inicial
-- Correr en Supabase SQL Editor (o via `supabase db push` si usás la CLI).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: 1:1 con auth.users, se crea automáticamente al registrarse
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,
  location text,
  rating numeric(3, 2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);

create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- items: objetos publicados para intercambiar
-- ---------------------------------------------------------------------------
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  condition text not null default 'usado'
    check (condition in ('nuevo', 'como_nuevo', 'usado', 'para_repuestos')),
  images text[] not null default '{}',
  looking_for_categories text[] not null default '{}',
  looking_for_description text,
  status text not null default 'available'
    check (status in ('available', 'matched', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_category_idx on items(category);
create index if not exists items_status_idx on items(status);
create index if not exists items_looking_for_idx on items using gin(looking_for_categories);

-- ---------------------------------------------------------------------------
-- matches: un trueque propuesto — puede ser bilateral (2 legs) o en cadena (N legs)
-- ---------------------------------------------------------------------------
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'proposed'
    check (status in ('proposed', 'accepted', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- cada leg = "giver" entrega `item_id` a "receiver" dentro del ciclo
create table if not exists match_legs (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  giver_id uuid not null references profiles(id),
  receiver_id uuid not null references profiles(id),
  item_id uuid not null references items(id),
  giver_confirmed boolean not null default false,
  receiver_confirmed boolean not null default false,
  unique (match_id, item_id)
);

create index if not exists match_legs_match_idx on match_legs(match_id);
create index if not exists match_legs_giver_idx on match_legs(giver_id);
create index if not exists match_legs_receiver_idx on match_legs(receiver_id);

-- ---------------------------------------------------------------------------
-- messages: chat scoped a un match (se desbloquea cuando el match existe)
-- ---------------------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_match_idx on messages(match_id);

-- ---------------------------------------------------------------------------
-- ratings: calificación post-trueque, entre participantes de un match completado
-- ---------------------------------------------------------------------------
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  rater_id uuid not null references profiles(id),
  ratee_id uuid not null references profiles(id),
  score int not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (match_id, rater_id, ratee_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table items enable row level security;
alter table matches enable row level security;
alter table match_legs enable row level security;
alter table messages enable row level security;
alter table ratings enable row level security;

-- profiles: lectura pública, cada quien edita solo lo suyo
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- items: disponibles son públicos; el dueño ve y edita siempre los suyos
create policy "items_select_available_or_own" on items for select
  using (status = 'available' or owner_id = auth.uid());
create policy "items_insert_own" on items for insert
  with check (owner_id = auth.uid());
create policy "items_update_own" on items for update
  using (owner_id = auth.uid());
create policy "items_delete_own" on items for delete
  using (owner_id = auth.uid());

-- matches / legs: visibles solo para participantes del ciclo
create policy "match_legs_select_participant" on match_legs for select
  using (auth.uid() = giver_id or auth.uid() = receiver_id);

create policy "matches_select_participant" on matches for select
  using (
    exists (
      select 1 from match_legs
      where match_legs.match_id = matches.id
        and (match_legs.giver_id = auth.uid() or match_legs.receiver_id = auth.uid())
    )
  );

-- ambas partes de cada leg confirman su propio lado de la entrega
create policy "match_legs_update_own_confirmation" on match_legs for update
  using (auth.uid() = giver_id or auth.uid() = receiver_id);

-- messages: solo participantes del match pueden leer/escribir
create policy "messages_select_participant" on messages for select
  using (
    exists (
      select 1 from match_legs
      where match_legs.match_id = messages.match_id
        and (match_legs.giver_id = auth.uid() or match_legs.receiver_id = auth.uid())
    )
  );
create policy "messages_insert_participant" on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from match_legs
      where match_legs.match_id = messages.match_id
        and (match_legs.giver_id = auth.uid() or match_legs.receiver_id = auth.uid())
    )
  );

-- ratings: lectura pública (forman la reputación), solo participantes califican
create policy "ratings_select_all" on ratings for select using (true);
create policy "ratings_insert_participant" on ratings for insert
  with check (
    rater_id = auth.uid()
    and exists (
      select 1 from match_legs
      where match_legs.match_id = ratings.match_id
        and (match_legs.giver_id = auth.uid() or match_legs.receiver_id = auth.uid())
    )
  );
