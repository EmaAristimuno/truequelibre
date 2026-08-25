-- Habilita actualizaciones en tiempo real para el chat de cada trueque.
-- RLS sigue aplicando sobre las suscripciones: cada usuario solo recibe
-- mensajes de matches donde participa.

alter publication supabase_realtime add table messages;
