import { createClient } from "@supabase/supabase-js";

// Cliente de navegador. La clave publicable es pública por diseño:
// lo que cada usuario puede leer o modificar lo controlan las políticas RLS en Postgres.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
