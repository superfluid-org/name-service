import { Address } from "viem"

import { afResolver } from "./af"
import { ensResolver } from "./ens"
import { farcasterResolver } from "./farcaster"
import { lensResolver } from "./lens"
import { torexResolver } from "./torex"

export type Profile = {
  handle: string | null
  avatarUrl: string | null
}

export type ProfileWithRecommended = Profile & {
  recommendedName: string | null
  recommendedAvatar: string | null
}

export interface Resolver {
  name: string
  getProfile(address: Address): Promise<Profile | null>
  getAddress(handle: string): Promise<Address | null>
}

export const resolvers: Resolver[] = [torexResolver, ensResolver, farcasterResolver, afResolver, lensResolver].map(resolver => ({
  ...resolver,
  getProfile: async (address: Address) => {
    console.time(`getProfile ${resolver.name}`)
    const result = await resolver.getProfile(address)
    console.timeEnd(`getProfile ${resolver.name}`)
    return result
  }
}))

export function getRecommendedName(profiles: Record<string, Profile | null>): string | null {
  // Priority order: TOREX -> ENS -> Farcaster -> AlfaFrens -> Lens
  return profiles.TOREX?.handle ||
         profiles.ENS?.handle ||
         profiles.Farcaster?.handle ||
         profiles.AlfaFrens?.handle ||
         profiles.Lens?.handle ||
         null
}

export function getRecommendedAvatar(profiles: Record<string, Profile | null>): string | null {
  // Priority order: TOREX -> ENS -> Farcaster -> AlfaFrens -> Lens
  return profiles.TOREX?.avatarUrl ||
         profiles.ENS?.avatarUrl ||
         profiles.Farcaster?.avatarUrl ||
         profiles.AlfaFrens?.avatarUrl ||
         profiles.Lens?.avatarUrl ||
         null
}
