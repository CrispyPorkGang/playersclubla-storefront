"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const RefinementList = () => {
  return (
    <div className="flex small:flex-col gap-12 py-4 mb-8 small:px-0 pl-6 small:min-w-[250px] small:ml-[1.675rem]">
      <div>
        <h3 className="text-base-semi mb-4">Categories</h3>
        <ul className="text-base-regular flex small:flex-col gap-2">
          <li>
            <LocalizedClientLink href="/categories/flower">Flower</LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href="/categories/carts-disposables">Carts & Disposables</LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href="/categories/extracts">Extracts</LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href="/categories/kaws-moonrocks">Kaws Moonrocks</LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href="/categories/snowcaps">Snowcaps</LocalizedClientLink>
          </li>
          <li>
            <LocalizedClientLink href="/categories/mushroom-edibles">Mushroom Edibles</LocalizedClientLink>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default RefinementList