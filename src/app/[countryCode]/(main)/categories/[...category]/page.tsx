import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCategoryByHandle } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"
import CategoryTemplate from "@modules/categories/templates"
import { StoreProductCategory } from "@medusajs/types"

type Props = {
  params: Promise<{ 
    category: string[]
    countryCode: string 
  }>
  searchParams: Promise<{
    page?: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const { product_categories } = await getCategoryByHandle(category)

  const title = product_categories
    .map((category: StoreProductCategory) => category.name)
    .join(" | ")

  const description = product_categories[product_categories.length - 1].description ?? `${title} category`

  return {
    title: `${title} | Players Club LA`,
    description,
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams;
  const { countryCode, category } = await props.params;
  const { page } = searchParams

  try {
    const region = await getRegion(countryCode)
    if (!region) {
      notFound()
    }

    const { product_categories } = await getCategoryByHandle(category)
    if (!product_categories) {
      notFound()
    }

    const pageNumber = page ? parseInt(page) : 1

    return (
      <CategoryTemplate
        categories={product_categories}
        page={pageNumber.toString()}
        countryCode={countryCode}
      />
    )
  } catch (error) {
    notFound()
  }
}