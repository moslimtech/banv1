import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Try public directory first
    const publicPath = path.join(process.cwd(), 'public', 'favicon.ico')
    if (fs.existsSync(publicPath)) {
      const fileBuffer = fs.readFileSync(publicPath)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }
    
    // Fallback: try app directory
    const appPath = path.join(process.cwd(), 'app', 'favicon.ico')
    if (fs.existsSync(appPath)) {
      const fileBuffer = fs.readFileSync(appPath)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }
    
    return new NextResponse('Not Found', { status: 404 })
  } catch (error) {
    console.error('Error serving favicon:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
