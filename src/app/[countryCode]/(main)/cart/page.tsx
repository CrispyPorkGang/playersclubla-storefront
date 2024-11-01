import { Metadata } from "next"
import CartTemplate from "@modules/cart/templates"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"
import { getRegion } from "@lib/data/regions"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string }>
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  return {
    title: "Cart",
    description: "View your cart",
  }
}

const fetchCart = async () => {
  const cart = await retrieveCart().catch(() => null)

  if (!cart) {
    return null
  }

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id!)
    cart.items = enrichedItems as HttpTypes.StoreCartLineItem[]
  }

  return cart
}

export default async function Cart(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const cart = await fetchCart()
  const customer = await getCustomer().catch(() => null)

  return <CartTemplate cart={cart} customer={customer} />
}