import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getRegion } from "@lib/data/regions"
import StoreTemplate from "@modules/store/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export const metadata: Metadata = {
  title: "Players Club LA",
  description: "Explore all of our products.",
}

type Props = {
  params: Promise<{ countryCode: string }>,
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export default async function StorePage(props: Props) {
  // Await both params and searchParams
  const [{ countryCode }, searchParams] = await Promise.all([
    props.params,
    props.searchParams
  ])

  const region = await getRegion(countryCode)
  if (!region) {
    notFound()
  }

  // Now we can safely use the searchParams
  const { sortBy, page } = searchParams

  return (
    <StoreTemplate
      countryCode={countryCode}
      page={page}
      sortBy={sortBy}
    />
  )
}