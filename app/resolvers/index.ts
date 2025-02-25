import { Address } from "viem"

import { afResolver } from "./af"
import { ensResolver } from "./ens"
import { farcasterResolver } from "./farcaster"
import { lensResolver } from "./lens"

export type Profile = {
  handle: string | null
  avatarUrl: string | null
}

export interface Resolver {
  name: string
  getProfile(address: Address): Promise<Profile | null>
  getAddress(handle: string): Promise<Address | null>
}

export const resolvers: Resolver[] = [afResolver, ensResolver, farcasterResolver, lensResolver].map(resolver => ({
  ...resolver,
  getProfile: async (address: Address) => {
    console.time(`getProfile ${resolver.name}`)
    const result = await resolver.getProfile(address)
    console.timeEnd(`getProfile ${resolver.name}`)
    return result
  }
}))
