import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

// Browser-Client — nur für Auth-State und Realtime verwenden.
// Datenbankoperationen gehören in Server Components / Server Actions.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
