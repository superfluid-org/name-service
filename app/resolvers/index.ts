import { Address } from "viem"

import { ensResolver } from "./ens"
import { farcasterResolver } from "./farcaster"
import { polyThemesResolver } from "./polythemes"
import { STATIC_SERVICE_NAMES, staticResolvers } from "./static"
import { torexResolver } from "./torex"

export type Profile = {
  handle: string | null
  avatarUrl: string | null
  address?: string | null
}

export type ProfileWithRecommended = Profile & {
  recommendedName: string | null
  recommendedAvatar: string | null
  recommendedService: string | null
}

export interface Resolver {
  name: string
  getProfile(address: Address): Promise<Profile | null>
  getAddress(handle: string): Promise<Profile | null>
}

export const resolvers: Resolver[] = [
  ...staticResolvers,
  polyThemesResolver,
  torexResolver,
  ensResolver,
  farcasterResolver
].map(resolver => ({
  ...resolver,
  getProfile: async (address: Address) => {
    console.time(`getProfile ${resolver.name}`)
    const result = await resolver.getProfile(address)
    console.timeEnd(`getProfile ${resolver.name}`)
    return result
  }
}))

// Priority order: static registries -> ENS -> Farcaster -> PolyThemes -> TOREX.
// Curated static entries win because they are an authoritative label for a known contract.
const SERVICE_PRIORITY: string[] = [...STATIC_SERVICE_NAMES, "ENS", "Farcaster", "PolyThemes", "TOREX"]

export function getRecommendedName(profiles: Record<string, Profile | null>): string | null {
  for (const service of SERVICE_PRIORITY) {
    const handle = profiles[service]?.handle

    if (handle) {
      return handle
    }
  }

  return null
}

export function getRecommendedAvatar(profiles: Record<string, Profile | null>): string | null {
  for (const service of SERVICE_PRIORITY) {
    const avatarUrl = profiles[service]?.avatarUrl

    if (avatarUrl) {
      return avatarUrl
    }
  }

  return null
}

export function getRecommendedService(profiles: Record<string, Profile | null>): string | null {
  // Return the service that provided either the recommended name OR avatar
  for (const service of SERVICE_PRIORITY) {
    const profile = profiles[service]

    if (profile?.handle || profile?.avatarUrl) {
      return service
    }
  }

  return null
}
