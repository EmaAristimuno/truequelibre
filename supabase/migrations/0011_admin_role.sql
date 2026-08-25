-- Rol de administrador para el panel de finanzas. Se otorga a mano por SQL
-- (no hay UI para auto-promoverse, a propósito).
alter table profiles
  add column if not exists is_admin boolean not null default false;
