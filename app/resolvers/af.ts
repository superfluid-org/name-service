import { Resolver } from "."
import { getAddress } from "viem"

type AFProfileByTradingAddressResponse = {
  userAddress: string | null
  handle: string | null
  channelAddress: string | undefined
  channelTitle: string | undefined
  profileImgUrl: string | undefined
}

type AFProfileByAddressResponse = {
  channeladdress: string | undefined
  userAddress: string | null
  fid: string | null
  handle: string | null
}

export const afResolver: Resolver = {
  name: "AlfaFrens",
  async getProfile(address) {
    try {
      const response = await fetch(`http://alfafrens.com/api/v0/getUserByTradingAddress?userAddress=${address}`)
      const data = (await response.json()) as AFProfileByTradingAddressResponse

      return {
        handle: data.userAddress || null,
        avatarUrl: data.profileImgUrl || null
      }
    } catch {
      return null
    }
  },
  async getAddress(handle) {
    try {
      const response = await fetch(`https://alfafrens.com/api/v0/getUserByAddress?userAddress=${handle}`)
      const data = (await response.json()) as AFProfileByAddressResponse
      return getAddress(data.userAddress || "")
    } catch {
      return null
    }
  }
} as const
