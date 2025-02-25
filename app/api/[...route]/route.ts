import { Hono } from "hono"
import { handle } from "hono/vercel"
import { cors } from "hono/cors"
import { createPublicClient, http, isAddress } from "viem"
import { mainnet } from "viem/chains"

import { Profile, resolvers } from "@/app/resolvers"

// NEXTJS CONFIG
export const runtime = "edge"

// IMPLEMENTATION
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

const app = new Hono().basePath("/api")
app.use("/*", cors())

app.get("/resolve/:address", async c => {
  const address = c.req.param("address")
  const services = c.req.query("services")?.split(",") || []

  if (!isAddress(address)) {
    return c.json({ error: "Invalid address" }, 400)
  }

  const actualResolvers = services.length ? resolvers.filter(resolver => services.includes(resolver.name)) : resolvers

  const results = await Promise.all(
    actualResolvers.map(
      async resolver => [resolver.name, await resolver.getProfile(address)] as [string, Profile | null]
    )
  )

  const mappedResults = results.reduce(
    (acc, [name, profile]) => {
      acc[name] = profile

      return acc
    },
    {} as Record<string, Profile | null>
  )

  return c.json(mappedResults, 200, {
    "Cache-Control": "s-maxage=900, stale-while-revalidate=3600"
  })
})

app.get("/reverse-resolve/:handle", async c => {
  const handle = c.req.param("handle")
  const services = c.req.query("services")?.split(",") || []

  const actualResolvers = services.length ? resolvers.filter(resolver => services.includes(resolver.name)) : resolvers

  const results = await Promise.all(
    actualResolvers.map(async resolver => [resolver.name, await resolver.getAddress(handle)] as [string, string | null])
  )

  const mappedResults = results.reduce(
    (acc, [name, address]) => {
      acc[name] = address

      return acc
    },
    {} as Record<string, string | null>
  )

  return c.json(mappedResults, 200, {
    "Cache-Control": "s-maxage=900, stale-while-revalidate=3600"
  })
})

export const GET = handle(app)
