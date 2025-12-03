import { Address } from "viem"
import { base, celo, optimism, arbitrum } from "viem/chains"
import { Resolver } from "."

export interface TOREXInfo {
  id: Address;
  name: string;
}

// Deprecated torexes - these will have their names prefixed with "Deprecated: "
const DEPRECATED_TOREXES: Record<number, Address[]> = {
  [base.id]: [
    "0xfdf3e44ca7fe2006c3b5c20cf8fcf5c556dc19be",
    "0x727dd7ec3f3398afb655528a5076062a4a73ad6a",
    "0xdc6ed4fe13280b8257267162a32526078a3defa5",
    "0x8a9570a982ada64fe4a4336e88b133c02886488d",
  ],
}

const TOREX_GRAPHQL_ENDPOINTS: Record<number, string> = {
  [base.id]: 'https://api.goldsky.com/api/public/project_clsnd6xsoma5j012qepvucfpp/subgraphs/superboring_base-mainnet/prod/gn',
  [optimism.id]: 'https://api.goldsky.com/api/public/project_clsnd6xsoma5j012qepvucfpp/subgraphs/superboring_optimism-mainnet/prod/gn',
  [celo.id]: 'https://api.goldsky.com/api/public/project_clsnd6xsoma5j012qepvucfpp/subgraphs/superboring_celo-mainnet/prod/gn',
  [arbitrum.id]: 'https://api.goldsky.com/api/public/project_clsnd6xsoma5j012qepvucfpp/subgraphs/superboring_arbitrum-one/prod/gn'
}

const TOREX_QUERY = `
  query MyQuery {
    torexes {
      id
      name
    }
  }
`

interface TorexResponse {
  data: {
    torexes: TOREXInfo[]
  }
}

function isDeprecatedTorex(chainId: number, address: Address): boolean {
  const deprecatedList = DEPRECATED_TOREXES[chainId] || []
  return deprecatedList.some(addr => addr.toLowerCase() === address.toLowerCase())
}

async function fetchTorexesForChain(chainId: number): Promise<TOREXInfo[]> {
  const endpoint = TOREX_GRAPHQL_ENDPOINTS[chainId]
  if (!endpoint) {
    return []
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: TOREX_QUERY
      }),
      next: { revalidate: 86400 } // 24 hours
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: TorexResponse = await response.json()
    return result.data.torexes.map(torex => {
      const id = torex.id.toLowerCase() as Address
      const isDeprecated = isDeprecatedTorex(chainId, id)
      return {
        id,
        name: isDeprecated ? `Deprecated: ${torex.name}` : torex.name
      }
    })
  } catch (error) {
    console.error(`Failed to fetch TOREX data for chain ${chainId}:`, error)
    return []
  }
}

async function getAllTorexes(): Promise<Record<string, TOREXInfo>> {
  try {
    const allChains = Object.keys(TOREX_GRAPHQL_ENDPOINTS).map(Number)
    const allTorexes = await Promise.all(
      allChains.map(chainId => fetchTorexesForChain(chainId))
    )

    return allTorexes
      .flat()
      .reduce((acc, torex) => {
        acc[torex.id.toLowerCase()] = torex
        return acc
      }, {} as Record<string, TOREXInfo>)
  } catch (error) {
    console.error('Failed to fetch TOREX data:', error)
    return {}
  }
}

export async function getTOREXInfo(address: string): Promise<TOREXInfo | null> {
  const allTorexes = await getAllTorexes()
  return allTorexes[address.toLowerCase()] || null
}

export async function isTOREXAddress(address: string): Promise<boolean> {
  const allTorexes = await getAllTorexes()
  return address.toLowerCase() in allTorexes
}

function getAvatarBaseUrl(): string {
  const deployUrl = process.env.BASE_URL
  if (deployUrl) {
    return deployUrl.startsWith('http') ? deployUrl : `https://${deployUrl}`
  }
  
  return 'http://localhost:3000'
}

function getAvatarUrl(baseUrl: string, isDeprecated: boolean): string {
  return isDeprecated
    ? `${baseUrl}/assets/deprecated-torex-avatar.svg`
    : `${baseUrl}/assets/torex-avatar.png`
}

export const torexResolver: Resolver = {
  name: "TOREX",
  async getProfile(address) {
    try {
      const torexInfo = await getTOREXInfo(address)

      if (!torexInfo) {
        return null
      }

      const baseUrl = getAvatarBaseUrl()
      const isDeprecated = torexInfo.name.startsWith("Deprecated:")
      return {
        handle: torexInfo.name + " TOREX",
        avatarUrl: getAvatarUrl(baseUrl, isDeprecated),
        address
      }
    } catch {
      return null
    }
  },
  async getAddress(handle) {
    try {
      const allTorexes = await getAllTorexes()

      const torexEntry = Object.values(allTorexes).find(
        (torex: TOREXInfo) => torex.name.toLowerCase() === handle.toLowerCase()
      )

      if (!torexEntry) {
        return null
      }

      const baseUrl = getAvatarBaseUrl()
      const isDeprecated = torexEntry.name.startsWith("Deprecated:")
      return {
        handle: torexEntry.name + " TOREX",
        avatarUrl: getAvatarUrl(baseUrl, isDeprecated),
        address: torexEntry.id
      }
    } catch {
      return null
    }
  }
} as const 