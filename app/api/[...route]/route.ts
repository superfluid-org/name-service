import { Hono } from "hono"
import { handle } from "hono/vercel"
import { cors } from "hono/cors"
import { isAddress } from "viem"

import { Profile, resolvers, getRecommendedName, getRecommendedAvatar, ProfileWithRecommended } from "@/app/resolvers"

// NEXTJS CONFIG
export const runtime = "edge"

// IMPLEMENTATION
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

  const responseWithRecommended = {
    ...mappedResults,
    recommendedName: getRecommendedName(mappedResults),
    recommendedAvatar: getRecommendedAvatar(mappedResults)
  }

  return c.json(responseWithRecommended, 200, {
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

  if (mappedResults.ENS && isAddress(mappedResults.ENS)) {
    try {
      const profileResults = await Promise.all(
        actualResolvers.map(
          async resolver => [resolver.name, await resolver.getProfile(mappedResults.ENS as `0x${string}`)] as [string, Profile | null]
        )
      )

      const profiles = profileResults.reduce(
        (acc, [name, profile]) => {
          acc[name] = profile
          return acc
        },
        {} as Record<string, Profile | null>
      )

      const enhancedResults = Object.keys(mappedResults).reduce((acc, serviceName) => {
        const address = mappedResults[serviceName]
        const profile = profiles[serviceName]
        
        if (profile) {
          acc[serviceName] = {
            address,
            ...profile
          }
        } else {
          acc[serviceName] = address
        }
        
        return acc
      }, {} as Record<string, any>)

      // Add recommended fields
      enhancedResults.recommendedName = getRecommendedName(profiles)
      enhancedResults.recommendedAvatar = getRecommendedAvatar(profiles)

      return c.json(enhancedResults, 200, {
        "Cache-Control": "s-maxage=900, stale-while-revalidate=3600"
      })
    } catch (error) {
      // If profile lookup fails, just return the original results
      console.error("Failed to lookup profiles for ENS address:", error)
    }
  }

  return c.json(mappedResults, 200, {
    "Cache-Control": "s-maxage=900, stale-while-revalidate=3600"
  })
})

function getFullAvatarUrl(c: any): string {
  const url = new URL(c.req.url)
  return `${url.protocol}//${url.host}/assets/torex-avatar.png`
}

app.get("/torex-avatar-url", async c => {
  return c.json({ url: getFullAvatarUrl(c) })
})

export const GET = handle(app)
