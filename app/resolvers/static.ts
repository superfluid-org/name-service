import moralHazard from "@/app/static/moralhazard.json"
import { Profile, Resolver } from "."

// Chain id -> profiles of known contracts on that chain. Entries are stored in resolved
// `Profile` shape so a match can be handed back as-is.
type StaticRegistry = Record<string, Profile[]>

// The edge runtime cannot enumerate files at runtime, so each registry is imported
// statically. To add a project: drop a JSON in app/static/ and add one line here.
const REGISTRIES: { service: string; registry: StaticRegistry }[] = [{ service: "MoralHazard", registry: moralHazard }]

// Superfluid testnets, sorted last so a handle used on several chains resolves to the
// mainnet contract instead of depending on object key iteration order.
const TESTNET_CHAIN_IDS = new Set([11155111, 11155420, 84532, 43113, 5042002])

function getAvatarBaseUrl(): string {
  const deployUrl = process.env.BASE_URL
  if (deployUrl) {
    return deployUrl.startsWith("http") ? deployUrl : `https://${deployUrl}`
  }

  return "http://localhost:3000"
}

// Entries carry either an absolute URL or a path relative to this deployment.
function resolveAvatarUrl(avatarUrl: string | null): string | null {
  if (!avatarUrl) {
    return null
  }

  return avatarUrl.startsWith("http") ? avatarUrl : `${getAvatarBaseUrl()}${avatarUrl}`
}

function flatten(registry: StaticRegistry): Profile[] {
  return Object.keys(registry)
    .sort(
      (a, b) =>
        Number(TESTNET_CHAIN_IDS.has(Number(a))) - Number(TESTNET_CHAIN_IDS.has(Number(b))) || Number(a) - Number(b)
    )
    .flatMap(chainId => registry[chainId] ?? [])
}

function createStaticResolver(service: string, registry: StaticRegistry): Resolver {
  const entries = flatten(registry)

  const toProfile = (entry: Profile, address: string): Profile => ({
    handle: entry.handle,
    avatarUrl: resolveAvatarUrl(entry.avatarUrl),
    address
  })

  return {
    name: service,
    async getProfile(address) {
      const entry = entries.find(candidate => candidate.address?.toLowerCase() === address.toLowerCase())

      if (!entry) {
        return null
      }

      return toProfile(entry, address)
    },
    async getAddress(handle) {
      const entry = entries.find(candidate => candidate.handle?.toLowerCase() === handle.toLowerCase())

      if (!entry?.address) {
        return null
      }

      return toProfile(entry, entry.address)
    }
  }
}

export const staticResolvers: Resolver[] = REGISTRIES.map(({ service, registry }) =>
  createStaticResolver(service, registry)
)

export const STATIC_SERVICE_NAMES: string[] = REGISTRIES.map(({ service }) => service)
