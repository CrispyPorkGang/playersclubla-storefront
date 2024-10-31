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
    try {
      const response = await fetch(`${BACKEND_URL}/store/regions`, {
        headers: { "x-publishable-api-key": PUBLISHABLE_API_KEY! },
        next: { revalidate: 3600, tags: ["regions"] },
      });

      if (!response.ok) {
        console.error(`Failed to fetch regions: ${response.statusText}`);
        notFound();
      }

      const json = await response.json();
      if (!json || !json.regions?.length) {
        console.error("No regions data found in response.");
        notFound();
      }

      // Clear old data and update cache with new region data
      regionMap.clear();
      json.regions.forEach((region: HttpTypes.StoreRegion) => {
        region.countries?.forEach((c) => {
          regionMap.set(c.iso_2 ?? "", region);
        });
      });
      regionMapCache.regionMapUpdated = Date.now();
    } catch (error) {
      console.error("Error fetching regions:", error);
      notFound();
    }
  }

  return regionMap;
}

// Function to determine the country code for the request
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    const vercelCountryCode = request.headers.get("x-vercel-ip-country")?.toLowerCase();
    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase();

    if (urlCountryCode && regionMap.has(urlCountryCode)) return urlCountryCode;
    if (vercelCountryCode && regionMap.has(vercelCountryCode)) return vercelCountryCode;
    if (regionMap.has(DEFAULT_REGION)) return DEFAULT_REGION;
    return regionMap.keys().next().value || DEFAULT_REGION;
  } catch (error) {
    console.error("Error getting country code:", error);
    return DEFAULT_REGION;
  }
}

export async function middleware(request: NextRequest) {
  const regionMap = await getRegionMap();
  const countryCode = (await getCountryCode(request, regionMap)) || DEFAULT_REGION;

  const authToken = request.cookies.get("auth-token");

  // Restrict access to /store for unauthenticated users
  if (request.nextUrl.pathname.startsWith("/store") && !authToken) {
    const accountUrl = new URL(`/${countryCode}/account`, request.url);
    return NextResponse.redirect(accountUrl);
  }

  // Redirect if no country code in the URL
  if (!request.nextUrl.pathname.includes(`/${countryCode}`)) {
    const redirectUrl = `${request.nextUrl.origin}/${countryCode}${request.nextUrl.pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|favicon.ico).*)"],
};
