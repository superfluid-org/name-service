import { Resolver } from "."
import { getAddress } from "viem"

interface SearchcasterProfile {
  body: {
    id: number
    address: string | null
    username: string
    displayName: string
    bio: string
    followers: number
    following: number
    avatarUrl: string
    isVerifiedAvatar: boolean
    registeredAt: number
  }
  connectedAddress: string
  connectedAddresses: string[]
}

type SearchcasterProfilesResponse = SearchcasterProfile[]

export const farcasterResolver: Resolver = {
  name: "Farcaster",
  async getProfile(address) {
    try {
      const response = await fetch(`https://searchcaster.xyz/api/profiles?connected_address=${address}`)
      const data = (await response.json()) as SearchcasterProfilesResponse

      return {
        handle: data[0].body.username || null,
        avatarUrl: data[0].body.avatarUrl || null
      }
    } catch {
      return null
    }
  },
  async getAddress(handle) {
    try {
      const response = await fetch(`https://searchcaster.xyz/api/profiles?username=${handle}`)
      const data = (await response.json()) as SearchcasterProfilesResponse

      return getAddress(data[0].connectedAddress)
    } catch {
      return null
    }
  }
} as const
