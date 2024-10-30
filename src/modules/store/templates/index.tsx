import { Suspense } from "react"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import PaginatedProducts from "./paginated-products"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

interface StoreTemplateProps {
  countryCode: string
  page?: string
  sortBy?: SortOptions
}

const StoreTemplate = ({
  countryCode,
  page,
  sortBy,
}: StoreTemplateProps) => {
  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1 data-testid="store-page-title">All products</h1>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts 
            countryCode={countryCode}
            page={page ? parseInt(page) : 1}
            sortBy={sortBy}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate