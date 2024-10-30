"use client"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"

export type SortOptions = 
  | "price_asc" 
  | "price_desc" 
  | "created_at"
  | "/flower"
  | "/carts-disposables"
  | "/extracts"
  | "/kaws-moonrocks"
  | "/snowcaps"
  | "/mushroom-edibles"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions = [
  {
    value: "created_at",
    label: "Latest Arrivals",
  },
  {
    value: "flower",
    label: "Flower",
  },
  {
    value: "/carts-disposables",
    label: "Carts & Disposables",
  },
  {
    value: "/extracts",
    label: "Extracts",
  },
  {
    value: "/kaws-moonrocks",
    label: "Kaws Moonrocks",
  },
  {
    value: "/snowcaps",
    label: "Snowcaps",
  },
  {
    value: "/mushroom-edibles",
    label: "Mushroom Edibles",
  },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: SortOptions) => {
    setQueryParams("sortBy", value)
  }

  return (
    <FilterRadioGroup
      title="Sort by"
      items={sortOptions}
      value={sortBy}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts