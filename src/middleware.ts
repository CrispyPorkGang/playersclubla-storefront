import { NextRequest, NextResponse } from "next/server"
import { HttpTypes } from "@medusajs/types"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

async function getRegionMap() {
  try {
    const response = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: { 
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
        "Accept": "application/json",
        "Content-Type": "application/json",
        // Add CORS headers
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      cache: 'no-store'  // Disable caching
    })

    if (!response.ok) {
      console.error(`Region fetch failed: ${response.status} ${response.statusText}`)
      return new Map()
    }

    const data = await response.json()
    const regionMap = new Map<string, HttpTypes.StoreRegion>()

    if (data?.regions) {
      data.regions.forEach((region: HttpTypes.StoreRegion) => {
        region.countries?.forEach((c) => {
          if (c.iso_2) {
            regionMap.set(c.iso_2, region)
          }
        })
      })
    }

    return regionMap
  } catch (error) {
    console.error('Error in getRegionMap:', error)
    return new Map()
  }
}

export async function middleware(request: NextRequest) {
  // Rest of your middleware code remains the same
  const path = request.nextUrl.pathname
  
  if (
    path.includes('.') || 
    path.startsWith('/api') || 
    path.startsWith('/_next') || 
    path.startsWith('/favicon') ||
    path.includes('/auth') ||
    path.includes('/login') ||
    path.includes('/account')
  ) {
    return NextResponse.next()
  }

  // Default to US if no region is found
  const countryCode = DEFAULT_REGION

  // If no country code in path, redirect to default region
  if (!path.match(/^\/[a-z]{2}\//)) {
    const url = request.nextUrl.clone()
    url.pathname = `/${countryCode}${path}`
    const response = NextResponse.redirect(url)
    
    // Preserve cookies
    request.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, cookie.options)
    })
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|auth|login|account).*)',
  ],
}