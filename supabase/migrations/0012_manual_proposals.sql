-- Propuestas manuales de trueque (a diferencia del algoritmo automático,
-- que reserva los objetos apenas arma un ciclo): quien recibe una propuesta
-- por su objeto puede recibir varias en simultáneo, y el objeto sigue
-- "Disponible" hasta que el dueño elige una. `initiated_by` distingue estos
-- matches manuales (algoritmo automático = null) y marca quién propuso, para
-- saber quién es "el dueño" que tiene que decidir.
alter table matches
  add column if not exists initiated_by uuid references profiles(id);
