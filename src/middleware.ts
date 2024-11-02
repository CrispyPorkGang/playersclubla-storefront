import { NextRequest, NextResponse } from "next/server";
import { HttpTypes } from "@medusajs/types";
import { notFound } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us";

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
};

// Function to get the region map from Medusa
async function getRegionMap() {
  const { regionMap, regionMapUpdated } = regionMapCache;

  if (!regionMap.keys().next().value || regionMapUpdated < Date.now() - 3600 * 1000) {
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_API_KEY! },
      next: { revalidate: 3600, tags: ["regions"] },
    }).then((res) => res.json());

    if (!regions?.length) notFound();

    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region);
      });
    });

    regionMapCache.regionMapUpdated = Date.now();
  }

  return regionMapCache.regionMap;
}

// Function to determine the country code for the request
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion>
): Promise<string> { // Changed return type to always return string
  try {
    const vercelCountryCode = request.headers.get("x-vercel-ip-country")?.toLowerCase();
    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase();

    if (urlCountryCode && regionMap.has(urlCountryCode)) return urlCountryCode;
    if (vercelCountryCode && regionMap.has(vercelCountryCode)) return vercelCountryCode;
    if (regionMap.has(DEFAULT_REGION)) return DEFAULT_REGION;
    
    const firstCountry = regionMap.keys().next().value;
    if (firstCountry) return firstCountry;

    return DEFAULT_REGION; // Always return DEFAULT_REGION as fallback
  } catch (error) {
    console.error("Error getting country code:", error);
    return DEFAULT_REGION; // Return DEFAULT_REGION on error
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
    if (!request.nextUrl.pathname.includes(`/${countryCode}/`)) {
      const redirectUrl = `${request.nextUrl.origin}/${countryCode}${request.nextUrl.pathname}`;
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL(`/${DEFAULT_REGION}`, request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|favicon.ico).*)"],
};
