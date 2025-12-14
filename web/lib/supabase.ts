import { createClient } from '@supabase/supabase-js'

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vcrmmplcmbiilysvfqhc.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcm1tcGxjbWJpaWx5c3ZmcWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTUwNTgsImV4cCI6MjA4MTE3MTA1OH0.tyRumJV8_H-xjuf4OkQhDBTlL6q6XLjS1xG4PltDdIw'

// Singleton pattern to prevent multiple instances
let supabaseClient: ReturnType<typeof createClient> | null = null
let supabaseAdminClient: ReturnType<typeof createClient> | null = null

// Create client with singleton pattern (client-side only)
export const supabase = (() => {
  if (typeof window !== 'undefined') {
    // Client-side: use singleton
    if (!supabaseClient) {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    }
    return supabaseClient
  } else {
    // Server-side: create new instance each time (SSR)
    return createClient(supabaseUrl, supabaseAnonKey)
  }
})()

// Server-side client with service role
export const supabaseAdmin = (() => {
  if (typeof window !== 'undefined') {
    // Client-side: should not use service role
    return supabase
  } else {
    // Server-side: use singleton for admin
    if (!supabaseAdminClient) {
      supabaseAdminClient = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcm1tcGxjbWJpaWx5c3ZmcWhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU5NTA1OCwiZXhwIjoyMDgxMTcxMDU4fQ.co3Mv_Ml4KX_v3_grxVPBJkmtqzBZL5uuUxj7tW7OMA'
      )
    }
    return supabaseAdminClient
  }
})()
