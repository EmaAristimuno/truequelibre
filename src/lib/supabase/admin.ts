import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con service_role: ignora RLS. Úsalo solo para procesos de
 * backend de confianza (ej. el motor de matching), nunca por request
 * de un usuario individual ni importado en un componente cliente.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
