import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getRegion } from "@lib/data/regions"
import StoreTemplate from "@modules/store/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ countryCode: string }>,
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  return {
    title: "Players Club LA",
    description: "Explore all of our products.",
  }
}

export default async function StorePage(props: Props) {
  const [{ countryCode }, searchParams] = await Promise.all([
    props.params,
    props.searchParams
  ])

  const region = await getRegion(countryCode)
  if (!region) {
    notFound()
  }

  const { sortBy, page } = searchParams

  return (
    <StoreTemplate
      countryCode={countryCode}
      page={page}
      sortBy={sortBy}
    />
  )
}