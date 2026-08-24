-- Corrige visibilidad para cadenas de 3+ personas: un participante debe ver
-- TODOS los legs del match (no solo los propios) y los items de las otras
-- partes involucradas, para poder entender y aceptar el trueque completo.

drop policy if exists "match_legs_select_participant" on match_legs;
create policy "match_legs_select_participant" on match_legs for select
  using (
    exists (
      select 1 from match_legs as ml
      where ml.match_id = match_legs.match_id
        and (ml.giver_id = auth.uid() or ml.receiver_id = auth.uid())
    )
  );

create policy "items_select_match_participant" on items for select
  using (
    id in (
      select item_id from match_legs
      where match_id in (
        select match_id from match_legs
        where giver_id = auth.uid() or receiver_id = auth.uid()
      )
    )
  );
