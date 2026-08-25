-- Bug: no existía policy de UPDATE en `matches`, así que el cambio de
-- estado a 'accepted'/'completed' se ejecutaba sin error pero afectaba
-- 0 filas (RLS lo filtraba en silencio). Se agrega acá.

create policy "matches_update_participant" on matches for update
  using (
    exists (
      select 1 from match_legs
      where match_legs.match_id = matches.id
        and (match_legs.giver_id = auth.uid() or match_legs.receiver_id = auth.uid())
    )
  );
