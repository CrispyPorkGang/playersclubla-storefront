"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { omit } from "lodash"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { getAuthHeaders, getCartId, removeCartId, setCartId } from "./cookies"
import { getProductsById } from "./products"
import { getRegion } from "./regions"

// Ensures getAuthHeaders is correctly awaited when retrieving headers
async function getAuthHeadersAsync() {
  const headers = await getAuthHeaders();
  return headers;
}

async function retrieveCart() {
  const cartId = await getCartId();
  if (!cartId) return null;

  try {
    const headers = await getAuthHeadersAsync();
    
    // Pass the headers as the third argument instead of within SelectParams
    const { cart } = await sdk.store.cart.retrieve(cartId, {}, headers);

    return cart;
  } catch (error) {
    return null;
  }
}

async function getOrSetCart(countryCode: string) {
  let cart = await retrieveCart();
  const region = await getRegion(countryCode);

  if (!region) throw new Error(`Region not found for country code: ${countryCode}`);

  if (!cart) {
    const cartResp = await sdk.store.cart.create({ region_id: region.id });
    cart = cartResp.cart;
    setCartId(cart.id);
    revalidateTag("cart");
  }

  if (cart?.region_id !== region.id) {
    const headers = await getAuthHeadersAsync();

    // Pass `{}` for SelectParams, and headers as the fourth argument
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers);
    revalidateTag("cart");
  }

  return cart;
}


async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId();
  if (!cartId) throw new Error("No existing cart found, please create one before updating");

  try {
    const headers = await getAuthHeadersAsync();

    // Pass an empty object `{}` for SelectParams, and headers as the third argument
    const { cart } = await sdk.store.cart.update(cartId, data, {}, headers);
    revalidateTag("cart");
    return cart;
  } catch (error) {
    throw medusaError(error);
  }
}


async function addToCart({ variantId, quantity, countryCode }: { variantId: string; quantity: number; countryCode: string }) {
  if (!variantId) throw new Error("Missing variant ID when adding to cart");

  const cart = await getOrSetCart(countryCode);
  if (!cart) throw new Error("Error retrieving or creating cart");

  try {
    await sdk.store.cart.createLineItem(
      cart.id,
      { variant_id: variantId, quantity },
      {}, // Empty SelectParams
      await getAuthHeadersAsync() // Headers passed as the fourth argument
    );
    revalidateTag("cart");
  } catch (error) {
    throw medusaError(error);
  }
}

// Other functions below...
