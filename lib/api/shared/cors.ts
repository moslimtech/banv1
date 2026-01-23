import { NextResponse } from 'next/server'

/**
 * CORS headers for API routes
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * Handle CORS preflight requests
 */
export function handleCORS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * Create a CORS-enabled response
 */
export function corsResponse(data: any, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders,
  })
}
