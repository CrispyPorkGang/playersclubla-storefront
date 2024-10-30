import { Metadata } from "next"
import { notFound } from "next/navigation"
import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Players Club LA",
  description: "Power Up With Our Selection Of Cannabis Goods",
}

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function Home({ params }: Props) {
  const { countryCode } = await params

  try {
    const [collections, region] = await Promise.all([
      getCollectionsWithProducts(countryCode),
      getRegion(countryCode)
    ])

    if (!collections || !region) {
      notFound()
    }

    return (
      <>
        <Hero />
        <div className="py-12">
          <ul className="flex flex-col gap-x-6">
            <FeaturedProducts collections={collections} region={region} />
          </ul>
        </div>
      </>
    )
  } catch (error) {
    notFound()
  }
}