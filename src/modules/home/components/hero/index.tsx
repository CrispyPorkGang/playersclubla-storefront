import { Github } from "@medusajs/icons"
import { Button, Heading } from "@medusajs/ui"
import Link from "next/link" // Import Link from Next.js

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        <span>
          <Heading
            level="h1"
            className="text-3xl leading-10 text-ui-fg-base font-normal"
          >
            PLAYERS CLUB LA MENU
          </Heading>
          <Heading
            level="h2"
            className="text-2xl leading-10 text-ui-fg-subtle font-normal"
          >
            FLOOD SEASON ALL YEAR
          </Heading>
          <p className="subtitle">THIS IS VIEW ONLY MENU</p>
        </span>
        <Link href="/store" passHref>
          <Button as="a" variant="secondary">
            View Menu
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default Hero
