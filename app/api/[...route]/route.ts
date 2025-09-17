import { Hono } from "hono"
import { handle } from "hono/vercel"
import { cors } from "hono/cors"
import { isAddress } from "viem"

import { Profile, resolvers, getRecommendedName, getRecommendedAvatar, getRecommendedService } from "@/app/resolvers"

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
    recommendedAvatar: getRecommendedAvatar(mappedResults),
    recommendedService: getRecommendedService(mappedResults)
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
    actualResolvers.map(async resolver => [resolver.name, await resolver.getAddress(handle)] as [string, Profile | null])
  )

  const mappedResults = results.reduce(
    (acc, [name, profile]) => {
      acc[name] = profile
      return acc
    },
    {} as Record<string, Profile | null>
  )

  // Check if any resolver returned a valid profile with an address
  const validProfile = Object.values(mappedResults).find(profile => profile?.address)
  
  if (validProfile?.address && isAddress(validProfile.address)) {
    try {
      const profileResults = await Promise.all(
        actualResolvers.map(
          async resolver => [resolver.name, await resolver.getProfile(validProfile.address as `0x${string}`)] as [string, Profile | null]
        )
      )

      const enhancedProfiles = profileResults.reduce(
        (acc, [name, profile]) => {
          acc[name] = profile
          return acc
        },
        {} as Record<string, Profile | null>
      )

      // Merge enhanced profiles with original reverse lookup results
      // Use enhanced profile if it has data, otherwise keep original reverse lookup result
      const finalResults = Object.keys(mappedResults).reduce((acc, serviceName) => {
        const originalProfile = mappedResults[serviceName]
        const enhancedProfile = enhancedProfiles[serviceName]
        
        // Use enhanced profile if it has meaningful data (handle or avatar), otherwise use original
        if (enhancedProfile && (enhancedProfile.handle || enhancedProfile.avatarUrl)) {
          acc[serviceName] = enhancedProfile
        } else {
          acc[serviceName] = originalProfile
        }
        
        return acc
      }, {} as Record<string, any>)

      // Add recommended fields based on the enhanced profiles
      finalResults.recommendedName = getRecommendedName(enhancedProfiles)
      finalResults.recommendedAvatar = getRecommendedAvatar(enhancedProfiles)
      finalResults.recommendedService = getRecommendedService(enhancedProfiles)

      return c.json(finalResults, 200, {
        "Cache-Control": "s-maxage=900, stale-while-revalidate=3600"
      })
    } catch (error) {
      // If profile lookup fails, just return the original results with recommended fields
      console.error("Failed to lookup profiles:", error)
    }
  }

  // Add recommended fields based on the reverse lookup results
  const responseWithRecommended = {
    ...mappedResults,
    recommendedName: getRecommendedName(mappedResults),
    recommendedAvatar: getRecommendedAvatar(mappedResults),
    recommendedService: getRecommendedService(mappedResults)
  }

  return c.json(responseWithRecommended, 200, {
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
