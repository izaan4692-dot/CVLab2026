// Re-export from new location for backward compatibility
// Use @/lib/supabase/client for browser components
// Use @/lib/supabase/server for server components
export { createClient } from './supabase/client'
export type { User, Session } from '@supabase/supabase-js'

// Legacy export for components that still use the old import
import { createClient as createBrowserClient } from './supabase/client'
export const supabase = createBrowserClient()
