-- Coordenadas del perfil, para poder mostrar cercanía entre usuarios y,
-- a futuro, un mapa de objetos cercanos. `location` (texto) ya existía;
-- se agregan lat/lng para geolocalización real.

alter table profiles
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
