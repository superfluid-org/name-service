import { createPublicClient, http } from "viem"
import { mainnet } from "viem/chains"
import { normalize } from "viem/ens"
import { Resolver } from "."

const viemClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

export const ensResolver: Resolver = {
  name: "ENS",
  async getProfile(address) {
    try {
      const handle = await viemClient.getEnsName({ address })

      if (!handle) {
        return null
      }

      const avatarUrl = await viemClient.getEnsAvatar({ name: normalize(handle) })

      return {
        handle,
        avatarUrl,
        address
      }
    } catch {
      return null
    }
  },
  async getAddress(handle) {
    try {
      const address = await viemClient.getEnsAddress({ name: handle })
      
      if (!address) {
        return null
      }

      // Get additional profile information for the resolved address
      const avatarUrl = await viemClient.getEnsAvatar({ name: normalize(handle) })
      
      return {
        handle,
        avatarUrl,
        address
      }
    } catch {
      return null
    }
  }
} as const
