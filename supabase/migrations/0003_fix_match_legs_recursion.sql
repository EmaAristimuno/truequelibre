-- Corrige "infinite recursion detected in policy for relation match_legs",
-- causada por la policy de 0002 (se consultaba a sí misma). Usamos una
-- función SECURITY DEFINER: al pertenecer al owner de la tabla (postgres),
-- bypassa RLS en su consulta interna y rompe el ciclo de recursión.

create or replace function public.is_match_participant(p_match_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from match_legs
    where match_id = p_match_id
      and (giver_id = p_user_id or receiver_id = p_user_id)
  );
$$;

drop policy if exists "match_legs_select_participant" on match_legs;
create policy "match_legs_select_participant" on match_legs for select
  using (is_match_participant(match_id, auth.uid()));

drop policy if exists "items_select_match_participant" on items;
create policy "items_select_match_participant" on items for select
  using (
    exists (
      select 1 from match_legs
      where match_legs.item_id = items.id
        and is_match_participant(match_legs.match_id, auth.uid())
    )
  );
