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
        avatarUrl
      }
    } catch {
      return null
    }
  },
  async getAddress(handle) {
    try {
      return await viemClient.getEnsAddress({ name: handle })
    } catch {
      return null
    }
  }
} as const
