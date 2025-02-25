import { LensClient, production } from "@lens-protocol/client"
import { Resolver } from "."
import { getAddress } from "viem"

const client = new LensClient({ environment: production })

export const lensResolver: Resolver = {
  name: "Lens",
  async getProfile(address) {
    try {
      const result = await client.wallet.ownedHandles({
        for: address
      })

      const handle = result.items[0].fullHandle || null
      const profile = await client.profile.fetch({ forHandle: handle })

      return {
        handle,
        avatarUrl: profile?.metadata?.coverPicture?.optimized?.uri || null
      }
    } catch {
      return null
    }
  },
  async getAddress(handle) {
    try {
      const address = await client.handle.resolveAddress({ handle })

      return getAddress(address || "")
    } catch {
      return null
    }
  }
} as const
