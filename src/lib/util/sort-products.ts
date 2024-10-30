import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
}

/**
 * Helper function to sort products by price until the store API supports sorting by price
 * @param products
 * @param sortBy
 * @returns products sorted by price
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions
): HttpTypes.StoreProduct[] {
  console.log("sortProducts function called with:", sortBy)
  console.log("Number of products before filtering:", products.length)

  let sortedProducts = products as MinPricedProduct[]

  try {
    // Filter products by category if not sorting by created_at or price
    if (sortBy !== "created_at" && sortBy !== "price_asc" && sortBy !== "price_desc") {
      console.log("Filtering by category:", sortBy)
      
      return products.filter(product => {
        console.log("Checking product:", product.title)
        console.log("Product categories:", product.categories)

        if (!product.categories) {
          return false
        }

        // Handle both array and single object cases
        const categories = Array.isArray(product.categories) 
          ? product.categories 
          : [product.categories]

        return categories.some(category => {
          const categoryHandle = category.handle?.toLowerCase() || ""
          const match = categoryHandle === sortBy.toLowerCase()
          console.log(`Comparing ${categoryHandle} with ${sortBy.toLowerCase()}: ${match}`)
          return match
        })
      })
    }


    // Handle date sorting
    if (sortBy === "created_at") {
      console.log("Sorting by date")
      sortedProducts.sort((a, b) => {
        return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      })
    }

    console.log("Number of products after filtering/sorting:", sortedProducts.length)
    return sortedProducts

  } catch (error) {
    console.error("Error in sortProducts:", error)
    return products
  }
}