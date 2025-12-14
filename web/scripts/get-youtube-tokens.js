// Script to help get YouTube tokens from database
// Run: node scripts/get-youtube-tokens.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.log('Please add:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=...')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function getYouTubeTokens() {
  console.log('🔍 Searching for admin YouTube credentials...\n')

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
    console.log('⚠️  No YouTube credentials found in database.')
    console.log('\n📝 Steps to get tokens:')
    console.log('1. Go to /admin/youtube in your app')
    console.log('2. Click "Connect YouTube Account"')
    console.log('3. Authorize the app')
    console.log('4. Run this script again\n')
    process.exit(0)
  }

  const profile = profiles[0]
  
  console.log('✅ Found YouTube credentials!\n')
  console.log('📋 Add these to your .env.local file:\n')
  console.log('YOUTUBE_ACCESS_TOKEN=' + profile.youtube_access_token)
  console.log('YOUTUBE_REFRESH_TOKEN=' + profile.youtube_refresh_token)
  if (profile.youtube_token_expiry) {
    console.log('YOUTUBE_TOKEN_EXPIRY=' + profile.youtube_token_expiry)
  }
  console.log('\n💡 Copy the lines above and add them to .env.local')
  console.log('💡 After adding, restart your server\n')
}

getYouTubeTokens()
