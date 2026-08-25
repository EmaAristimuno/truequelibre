-- Segundo paso del ciclo de vida de un trueque: después de que todas las
-- partes ACEPTAN la propuesta (giver_confirmed/receiver_confirmed), hace
-- falta un segundo check post-encuentro físico: "recibí mi objeto y está
-- conforme". Cuando todas las partes de todos los legs confirman recibo,
-- el match y los items pasan a 'completed'.

alter table match_legs
  add column if not exists giver_received boolean not null default false,
  add column if not exists receiver_received boolean not null default false;
