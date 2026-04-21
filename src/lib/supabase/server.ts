import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

// Server-Client — für alle Datenbankoperationen in Server Components,
// Server Actions und API Routes verwenden.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll wird auch in Server Components aufgerufen wo Cookies
            // nicht gesetzt werden können — kann ignoriert werden wenn
            // Middleware die Session aktuell hält.
          }
        },
      },
    },
  );
}
