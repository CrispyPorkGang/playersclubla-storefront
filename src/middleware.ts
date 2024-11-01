import { NextRequest, NextResponse } from "next/server";
import { HttpTypes } from "@medusajs/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us";

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
};

async function getRegionMap() {
  const { regionMap, regionMapUpdated } = regionMapCache;

  if (!regionMap.keys().next().value || regionMapUpdated < Date.now() - 3600 * 1000) {
    try {
      const response = await fetch(`${BACKEND_URL}/store/regions`, {
        headers: { 
          "x-publishable-api-key": PUBLISHABLE_API_KEY!,
        },
        next: { revalidate: 3600, tags: ["regions"] },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch regions: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data?.regions?.length) {
        return new Map<string, HttpTypes.StoreRegion>();
      }

      data.regions.forEach((region: HttpTypes.StoreRegion) => {
        region.countries?.forEach((c) => {
          regionMapCache.regionMap.set(c.iso_2 ?? "", region);
        });
      });

      regionMapCache.regionMapUpdated = Date.now();
    } catch (error) {
      console.error("Error fetching regions:", error);
      return new Map<string, HttpTypes.StoreRegion>();
    }
  }

  return regionMapCache.regionMap;
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion>
): Promise<string | undefined> {
  try {
    const vercelCountryCode = request.headers.get("x-vercel-ip-country")?.toLowerCase();
    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase();

    if (urlCountryCode && regionMap.has(urlCountryCode)) return urlCountryCode;
    if (vercelCountryCode && regionMap.has(vercelCountryCode)) return vercelCountryCode;
    if (regionMap.has(DEFAULT_REGION)) return DEFAULT_REGION;
    
    const firstCountry = regionMap.keys().next().value;
    if (firstCountry) return firstCountry;

    return DEFAULT_REGION;
  } catch (error) {
    console.error("Error getting country code:", error);
    return DEFAULT_REGION;
  }
}

export async function middleware(request: NextRequest) {
  try {
    const regionMap = await getRegionMap() || new Map<string, HttpTypes.StoreRegion>();
    const countryCode = await getCountryCode(request, regionMap);

    const authToken = request.cookies.get("auth-token");

    // Restrict access to /store for unauthenticated users
    if (request.nextUrl.pathname.startsWith("/store") && !authToken) {
      const accountUrl = new URL(`/${countryCode}/account`, request.url);
      return NextResponse.redirect(accountUrl);
    }

    // Redirect if no country code in the URL
    if (!request.nextUrl.pathname.includes(countryCode!)) {
      const redirectUrl = new URL(`/${countryCode}${request.nextUrl.pathname}`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // Fall back to default region on error
    return NextResponse.redirect(new URL(`/${DEFAULT_REGION}`, request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|favicon.ico).*)"],
};