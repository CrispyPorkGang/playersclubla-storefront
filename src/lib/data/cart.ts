"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { omit } from "lodash"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCartId, setCartId } from "./cookies"
import { getProductsById } from "./products"
import { getRegion } from "./regions"
export async function retrieveCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return null
  }

  const headers = await getAuthHeaders()
  
  return await sdk.store.cart
    .retrieve(cartId, {}, { next: { tags: ["cart"] }, ...headers })
    .then(({ cart }) => cart)
    .catch(() => {
      return null
    })
}

export async function getOrSetCart(countryCode: string) {
  let cart = await retrieveCart()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (!cart) {
    const cartResp = await sdk.store.cart.create({ region_id: region.id })
    cart = cartResp.cart
    await setCartId(cart.id)
    revalidateTag("cart")
  }

  if (cart && cart?.region_id !== region.id) {
    const headers = await getAuthHeaders()
    await sdk.store.cart.update(
      cart.id,
      { region_id: region.id },
      {},
      headers
    )
    revalidateTag("cart")
  }

  return cart
}

export async function enrichLineItems(
  items: HttpTypes.StoreCartLineItem[],
  regionId: string
) {
  const productIds = items
    .filter((item): item is HttpTypes.StoreCartLineItem & { variant: { product_id: string } } => 
      Boolean(item.variant?.product_id))
    .map(item => item.variant.product_id)

  const products = await getProductsById({ ids: productIds, regionId })

  if (!products) {
    return items
  }

  return items.map((item) => {
    if (!item.variant?.product_id) return item
    
    const product = products.find((p) => p.id === item.variant!.product_id)

    if (!product) {
      return item
    }

    return {
      ...item,
      variant: {
        ...item.variant,
        product: omit(product, ["variants"]),
      },
    }
  })
}