import { Address } from "viem"
import { Resolver } from "."

interface PolyThemesInfo {
  address: Address;
  name: string;
}

const POLYTHEMES: PolyThemesInfo[] = [
  {
    address: "0x197023610E70487b71525d36e822d5bB14040eC5",
    name: "PolyThemes Boring V2"
  },
  {
    address: "0x8Fcf7f10081b6183e566a726c726eC4Da21e20AC",
    name: "PolyThemes Boring V1"
  }
]

function getAvatarBaseUrl(): string {
  const deployUrl = process.env.BASE_URL
  if (deployUrl) {
    return deployUrl.startsWith('http') ? deployUrl : `https://${deployUrl}`
  }

  return 'http://localhost:3000'
}

function getAvatarUrl(baseUrl: string): string {
  return `${baseUrl}/assets/polythemes-avatar.png`
}

export const polyThemesResolver: Resolver = {
  name: "PolyThemes",
  async getProfile(address) {
    const entry = POLYTHEMES.find(
      polyTheme => polyTheme.address.toLowerCase() === address.toLowerCase()
    )

    if (!entry) {
      return null
    }

    return {
      handle: entry.name,
      avatarUrl: getAvatarUrl(getAvatarBaseUrl()),
      address
    }
  },
  async getAddress(handle) {
    const entry = POLYTHEMES.find(
      polyTheme => polyTheme.name.toLowerCase() === handle.toLowerCase()
    )

    if (!entry) {
      return null
    }

    return {
      handle: entry.name,
      avatarUrl: getAvatarUrl(getAvatarBaseUrl()),
      address: entry.address
    }
  }
} as const
