import { Resolver } from "."
import { getAddress } from "viem"

interface NeynarUser {
  object: "user"
  fid: number
  username: string
  display_name: string
  custody_address: string
  pfp_url: string
  profile: {
    bio: {
      text: string
    }
  }
  follower_count: number
  following_count: number
  verifications: string[]
  verified_addresses: {
    eth_addresses: string[]
    sol_addresses: string[]
    primary?: {
      eth_address: string
      sol_address: string
    }
  }
  verified_accounts: Array<{
    platform: string
    username: string
  }>
  power_badge: boolean
  score?: number
}

interface NeynarBulkByAddressResponse {
  [address: string]: NeynarUser[]
}

interface NeynarUserByUsernameResponse {
  user: NeynarUser
}

export const farcasterResolver: Resolver = {
  name: "Farcaster",
  async getProfile(address) {
    try {
      const apiKey = process.env.NEYNAR_API_KEY
      if (!apiKey) {
        console.warn("NEYNAR_API_KEY not found in environment variables")
        return null
      }

      const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk-by-address/?addresses=${address}`, {
        headers: {
          'x-api-key': apiKey
        }
      })
      
      if (!response.ok) {
        console.error(`Neynar API error: ${response.status}`)
        return null
      }

      const data = (await response.json()) as NeynarBulkByAddressResponse
      
      const usersArray = data[address.toLowerCase()] || data[address]
      if (!usersArray || usersArray.length === 0) {
        return null
      }

      const user = usersArray[0]
      return {
        handle: user.username || null,
        avatarUrl: user.pfp_url || null,
        address: user.verified_addresses.eth_addresses[0] || null
      }
    } catch (error) {
      console.error("Farcaster getProfile error:", error)
      return null
    }
  },
  async getAddress(handle) {
    try {
      const apiKey = process.env.NEYNAR_API_KEY
      if (!apiKey) {
        console.warn("NEYNAR_API_KEY not found in environment variables")
        return null
      }

      const response = await fetch(`https://api.neynar.com/v2/farcaster/user/by_username/?username=${handle}`, {
        headers: {
          'x-api-key': apiKey
        }
      })
      
      if (!response.ok) {
        console.error(`Neynar API error: ${response.status}`)
        return null
      }

      const data = (await response.json()) as NeynarUserByUsernameResponse

      if (!data.user || !data.user.verified_addresses.eth_addresses.length) {
        return null
      }

      const user = data.user
      return {
        handle: user.username || null,
        avatarUrl: user.pfp_url || null,
        address: getAddress(user.verified_addresses.eth_addresses[0])
      }
    } catch (error) {
      console.error("Farcaster getAddress error:", error)
      return null
    }
  }
} as const
