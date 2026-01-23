import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { errorResponse } from './errors'

/**
 * Get authenticated user from request
 */
export async function getAuthUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

/**
 * Require authentication for a route
 */
export async function requireAuth(request: NextRequest) {
  const user = await getAuthUser(request)
  
  if (!user) {
    throw {
      message: 'غير مصرح. يرجى تسجيل الدخول',
      status: 401,
      code: 'UNAUTHORIZED',
    }
  }

  return user
}

/**
 * Check if user is admin
 */
export async function requireAdmin(request: NextRequest) {
  const user = await requireAuth(request)
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    throw {
      message: 'غير مصرح. يجب أن تكون مديراً',
      status: 403,
      code: 'FORBIDDEN',
    }
  }

  return user
}
