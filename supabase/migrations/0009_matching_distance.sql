-- Radio máximo opcional que cada usuario puede setear (null = sin límite,
-- el algoritmo igual prioriza cercanía pero no descarta matches lejanos).
alter table profiles
  add column if not exists max_distance_km numeric;

-- Distancia real del tramo, calculada al momento de proponer el match,
-- para poder mostrarla en la UI sin tener que recalcularla después.
alter table match_legs
  add column if not exists distance_km numeric;
