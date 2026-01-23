import { supabase } from '@/lib/supabase'

export async function recordSiteVisit(visitorIp?: string): Promise<void> {
  const { error } = await supabase.from('site_visits').insert({
    visitor_ip: visitorIp,
  })

  if (error) {
    console.error('Error recording site visit:', error)
  }
}

export async function getSiteStats() {
  const today = new Date().toISOString().split('T')[0]

  // Get today's visits
  const { data: todayVisits, error: todayError } = await supabase
    .from('site_visits')
    .select('id', { count: 'exact' })
    .eq('visit_date', today)

  // Get total visits
  const { data: totalVisits, error: totalError } = await supabase
    .from('site_visits')
    .select('id', { count: 'exact' })

  if (todayError || totalError) {
    throw new Error('Error fetching site stats')
  }

  return {
    today: todayVisits?.length || 0,
    total: totalVisits?.length || 0,
  }
}
