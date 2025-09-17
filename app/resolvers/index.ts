import { Address } from "viem"

import { ensResolver } from "./ens"
import { farcasterResolver } from "./farcaster"
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

export const resolvers: Resolver[] = [torexResolver, ensResolver, farcasterResolver].map(resolver => ({
  ...resolver,
  getProfile: async (address: Address) => {
    console.time(`getProfile ${resolver.name}`)
    const result = await resolver.getProfile(address)
    console.timeEnd(`getProfile ${resolver.name}`)
    return result
  }
}))

export function getRecommendedName(profiles: Record<string, Profile | null>): string | null {
  // Priority order: TOREX -> ENS -> Farcaster
  return profiles.TOREX?.handle ||
         profiles.ENS?.handle ||
         profiles.Farcaster?.handle ||
         null
}

export function getRecommendedAvatar(profiles: Record<string, Profile | null>): string | null {
  // Priority order: TOREX -> ENS -> Farcaster
  return profiles.TOREX?.avatarUrl ||
         profiles.ENS?.avatarUrl ||
         profiles.Farcaster?.avatarUrl ||
         null
}

export function getRecommendedService(profiles: Record<string, Profile | null>): string | null {
  // Priority order: TOREX -> ENS -> Farcaster
  // Return the service that provided either the recommended name OR avatar
  if (profiles.TOREX?.handle || profiles.TOREX?.avatarUrl) return "TOREX"
  if (profiles.ENS?.handle || profiles.ENS?.avatarUrl) return "ENS" 
  if (profiles.Farcaster?.handle || profiles.Farcaster?.avatarUrl) return "Farcaster"
  return null
}
