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
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode;
    const vercelCountryCode = request.headers.get("x-vercel-ip-country")?.toLowerCase();
    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase();

    if (urlCountryCode && regionMap.has(urlCountryCode)) countryCode = urlCountryCode;
    else if (vercelCountryCode && regionMap.has(vercelCountryCode)) countryCode = vercelCountryCode;
    else if (regionMap.has(DEFAULT_REGION)) countryCode = DEFAULT_REGION;
    else if (regionMap.keys().next().value) countryCode = regionMap.keys().next().value;

    return countryCode;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error getting country code. Check Medusa Admin and env variable setup.");
    }
  }
}

export async function middleware(request: NextRequest) {
  const regionMap = await getRegionMap();
  const countryCode = await getCountryCode(request, regionMap);

  const authToken = request.cookies.get("auth-token");

  // Restrict access to /store for unauthenticated users
  if (request.nextUrl.pathname.startsWith("/store") && !authToken) {
    const accountUrl = new URL(`/${countryCode}/account`, request.url);
    return NextResponse.redirect(accountUrl);
  }

  // Redirect if no country code in the URL
  if (!request.nextUrl.pathname.includes(countryCode)) {
    const redirectUrl = `${request.nextUrl.origin}/${countryCode}${request.nextUrl.pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|favicon.ico).*)"],
};
