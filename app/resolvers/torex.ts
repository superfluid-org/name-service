import { Address } from "viem"
import { base, celo, optimism, arbitrum } from "viem/chains"
import { Resolver } from "."

export interface TOREXInfo {
  id: Address;
  name: string;
}

const TOREX_GRAPHQL_ENDPOINTS: Record<number, string> = {
  [base.id]: 'https://api.goldsky.com/api/public/project_clsnd6xsoma5j012qepvucfpp/subgraphs/superboring_base-mainnet/prod/gn',
  [optimism.id]: 'https://api.goldsky.com/api/public/project_clsnd6xsoma5j012qepvucfpp/subgraphs/superboring_optimism-mainnet/prod/gn',
  [celo.id]: 'https://api.goldsky.com/api/public/project_clsnd6xsoma5j012qepvucfpp/subgraphs/superboring_celo-mainnet/prod/gn',
  [arbitrum.id]: 'https://api.goldsky.com/api/public/project_clsnd6xsoma5j012qepvucfpp/subgraphs/superboring_arbitrum-one/prod/gn'
}

const torexCache: Record<number, { data: TOREXInfo[], timestamp: number }> = {}
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

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

async function fetchTorexesForChain(chainId: number): Promise<TOREXInfo[]> {
  const cached = torexCache[chainId]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

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
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: TorexResponse = await response.json()
    const torexes = result.data.torexes.map(torex => ({
      id: torex.id.toLowerCase() as Address,
      name: torex.name
    }))

    torexCache[chainId] = {
      data: torexes,
      timestamp: Date.now()
    }

    return torexes
  } catch (error) {
    console.error(`Failed to fetch TOREX data for chain ${chainId}:`, error)
    return cached?.data || []
  }
}

let globalTorexLookupMap: Record<string, TOREXInfo> = {}
let lastGlobalUpdate = 0

async function updateGlobalTorexLookupMap(): Promise<void> {
  if (Date.now() - lastGlobalUpdate < CACHE_DURATION) {
    return
  }

  try {
    const allChains = Object.keys(TOREX_GRAPHQL_ENDPOINTS).map(Number)
    const allTorexes = await Promise.all(
      allChains.map(chainId => fetchTorexesForChain(chainId))
    )

    globalTorexLookupMap = allTorexes
      .flat()
      .reduce((acc, torex) => {
        acc[torex.id.toLowerCase()] = torex
        return acc
      }, {} as Record<string, TOREXInfo>)

    lastGlobalUpdate = Date.now()
  } catch (error) {
    console.error('Failed to update global TOREX lookup map:', error)
  }
}

export async function getTOREXInfo(address: string): Promise<TOREXInfo | null> {
  await updateGlobalTorexLookupMap()
  return globalTorexLookupMap[address.toLowerCase()] || null
}

export async function isTOREXAddress(address: string): Promise<boolean> {
  await updateGlobalTorexLookupMap()
  return address.toLowerCase() in globalTorexLookupMap
}

function getAvatarBaseUrl(): string {
  const deployUrl = process.env.VERCEL_URL
  if (deployUrl) {
    return deployUrl.startsWith('http') ? deployUrl : `https://${deployUrl}`
  }
  
  return 'http://localhost:3000'
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
      return {
        handle: torexInfo.name,
        avatarUrl: `${baseUrl}/assets/torex-avatar.png`
      }
    } catch {
      return null
    }
  },
  async getAddress(handle) {
    try {
      await updateGlobalTorexLookupMap()
      
      const torexEntry = Object.values(globalTorexLookupMap).find(
        torex => torex.name.toLowerCase() === handle.toLowerCase()
      )
      
      return torexEntry?.id || null
    } catch {
      return null
    }
  }
} as const 