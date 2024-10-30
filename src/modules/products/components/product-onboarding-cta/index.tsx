import { Button, Container, Text } from "@medusajs/ui"
import { cookies, type UnsafeUnwrappedCookies } from "next/headers";

const ProductOnboardingCta = async () => {
  const cookieStore = await cookies()
  const isOnboarding = cookieStore.get("_medusa_onboarding")?.value === "true"

  if (!isOnboarding) {
    return null
  }

  return (
    <Container>
      <div className="flex flex-col gap-y-4 center">
        <Text className="text-ui-fg-base text-xl">
          You can now continue setting up your store in the admin.
        </Text>
        <a href="http://localhost:7001/a/orders?onboarding_step=create_order_nextjs">
          <Button className="w-full">Continue setup in admin</Button>
        </a>
      </div>
    </Container>
  )
}

export default ProductOnboardingCta