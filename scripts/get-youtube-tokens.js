// Script to help get YouTube tokens from database
// Run: node scripts/get-youtube-tokens.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function getYouTubeTokens() {

  // Get admin user with YouTube tokens
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, email, youtube_access_token, youtube_refresh_token, youtube_token_expiry, is_admin')
    .eq('is_admin', true)
    .not('youtube_access_token', 'is', null)
    .limit(1)

  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  if (!profiles || profiles.length === 0) {
    process.exit(0)
  }

  const profile = profiles[0]
  
  if (profile.youtube_token_expiry) {
  }
}

getYouTubeTokens()
