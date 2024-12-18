"use server";

import { sdk } from "@lib/config";
import medusaError from "@lib/util/medusa-error";
import { HttpTypes } from "@medusajs/types";
import { omit } from "lodash";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthHeaders, getCartId, removeCartId, setCartId } from "./cookies";
import { getProductsById } from "./products";
import { getRegion } from "./regions";

export async function retrieveCart() {
  const cartId = await getCartId();

  if (!cartId) {
    return null;
  }

  return await sdk.store.cart
    .retrieve(cartId, {}, await getAuthHeaders())
    .then(({ cart }) => cart)
    .catch(() => {
      return null;
    });
}

export async function getOrSetCart(countryCode: string) {
  let cart = await retrieveCart();
  const region = await getRegion(countryCode);

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`);
  }

  if (!cart) {
    const cartResp = await sdk.store.cart.create({ region_id: region.id });
    cart = cartResp.cart;
    setCartId(cart.id);
    revalidateTag("cart");
  }

  if (cart && cart?.region_id !== region.id) {
    const headers = await getAuthHeaders();
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers);
    revalidateTag("cart");
  }

  return cart;
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId();
  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating");
  }

  const headers = await getAuthHeaders();
  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(({ cart }) => {
      revalidateTag("cart");
      return cart;
    })
    .catch(medusaError);
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string;
  quantity: number;
  countryCode: string;
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart");
  }

  const cart = await getOrSetCart(countryCode);
  if (!cart) {
    throw new Error("Error retrieving or creating cart");
  }

  const headers = await getAuthHeaders();
  await sdk.store.cart
    .createLineItem(cart.id, { variant_id: variantId, quantity }, {}, headers)
    .then(() => {
      revalidateTag("cart");
    })
    .catch(medusaError);
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string;
  quantity: number;
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item");
  }

  const cartId = await getCartId();
  if (!cartId) {
    throw new Error("Missing cart ID when updating line item");
  }

  const headers = await getAuthHeaders();
  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .then(() => {
      revalidateTag("cart");
    })
    .catch(medusaError);
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item");
  }

  const cartId = await getCartId();
  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item");
  }

  const headers = await getAuthHeaders();
  await sdk.store.cart
    .deleteLineItem(cartId, lineId, headers)
    .then(() => {
      revalidateTag("cart");
    })
    .catch(medusaError);
  revalidateTag("cart");
}

export async function enrichLineItems(
  lineItems:
    | HttpTypes.StoreCartLineItem[]
    | HttpTypes.StoreOrderLineItem[]
    | null,
  regionId: string
) {
  if (!lineItems) return [];

  const queryParams = {
    ids: lineItems.map((lineItem) => lineItem.product_id!),
    regionId: regionId,
  };

  const products = await getProductsById(queryParams);
  if (!lineItems?.length || !products) {
    return [];
  }

  const enrichedItems = lineItems.map((item) => {
    const product = products.find((p: any) => p.id === item.product_id);
    const variant = product?.variants?.find(
      (v: any) => v.id === item.variant_id
    );

    if (!product || !variant) {
      return item;
    }

    return {
      ...item,
      variant: {
        ...variant,
        product: omit(product, "variants"),
      },
    };
  }) as HttpTypes.StoreCartLineItem[];

  return enrichedItems;
}

export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const data = {
      shipping_address: {
        first_name: formData.get("shipping_address.first_name"),
        last_name: formData.get("shipping_address.last_name"),
        address_1: formData.get("shipping_address.address_1"),
        address_2: "",
        company: formData.get("shipping_address.company"),
        postal_code: formData.get("shipping_address.postal_code"),
        city: formData.get("shipping_address.city"),
        country_code: formData.get("shipping_address.country_code"),
        province: formData.get("shipping_address.province"),
        phone: formData.get("shipping_address.phone"),
      },
      email: formData.get("email"),
    } as any

    const sameAsBilling = formData.get("same_as_billing")
    if (sameAsBilling === "on") data.billing_address = data.shipping_address

    if (sameAsBilling !== "on")
      data.billing_address = {
        first_name: formData.get("billing_address.first_name"),
        last_name: formData.get("billing_address.last_name"),
        address_1: formData.get("billing_address.address_1"),
        address_2: "",
        company: formData.get("billing_address.company"),
        postal_code: formData.get("billing_address.postal_code"),
        city: formData.get("billing_address.city"),
        country_code: formData.get("billing_address.country_code"),
        province: formData.get("billing_address.province"),
        phone: formData.get("billing_address.phone"),
      }
    await updateCart(data)
  } catch (e: any) {
    return e.message
  }

  redirect(
    `/${formData.get("shipping_address.country_code")}/checkout?step=delivery`
  )
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string;
  shippingMethodId: string;
}) {
  const headers = await getAuthHeaders();
  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(() => {
      revalidateTag("cart");
    })
    .catch(medusaError);
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: {
    provider_id: string;
    context?: Record<string, unknown>;
  }
) {
  const headers = await getAuthHeaders();
  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .then((resp) => {
      revalidateTag("cart");
      return resp;
    })
    .catch(medusaError);
}

export async function applyPromotions(codes: string[]) {
  const cartId = getCartId();
  if (!cartId) {
    throw new Error("No existing cart found");
  }

  await updateCart({ promo_codes: codes })
    .then(() => {
      revalidateTag("cart");
    })
    .catch(medusaError);
}

export async function placeOrder() {
  const cartId = await getCartId();
  if (!cartId) {
    throw new Error("No existing cart found when placing an order");
  }

  const headers = await getAuthHeaders();
  const cartRes = await sdk.store.cart
    .complete(cartId, {}, headers)
    .then((cartRes) => {
      revalidateTag("cart");
      return cartRes;
    })
    .catch(medusaError);

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase();
    removeCartId();
    redirect(`/${countryCode}/order/confirmed/${cartRes?.order.id}`);
  }

  return cartRes.cart;
}

export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId();
  const region = await getRegion(countryCode);

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`);
  }

  if (cartId) {
    await updateCart({ region_id: region.id });
    revalidateTag("cart");
  }

  revalidateTag("regions");
  revalidateTag("products");

  redirect(`/${countryCode}${currentPath}`);
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: any) {
    return e.message
  }
}