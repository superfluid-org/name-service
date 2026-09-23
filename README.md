# Name Service

This project provides an API to resolve profiles associated with blockchain addresses using various resolvers. The main functionality is implemented in `route.ts`, which handles incoming requests and queries different resolvers to fetch profile information.

## Features

- Resolve profiles using multiple resolvers (ENS, AF, Farcaster, Lens).
- CORS support.
- Edge runtime for fast response times.
- Caching for improved performance.

## API Endpoints

### Resolve Profile

**Endpoint:** `/api/resolve/:address`

**Method:** `GET`

**Parameters:**

- `address` (required): The blockchain address to resolve.
- `services` (optional): A comma-separated list of services to query. If not provided, all available resolvers will be used.

**Response:**

- `200 OK`: A JSON object containing the resolved profiles from the specified services.
- `400 Bad Request`: If the provided address is invalid.

**Example Request:**

```http
GET /api/resolve/0x1234567890abcdef1234567890abcdef12345678?services=ENS,Lens
```

**Example Response:**

```json
{
  "ENS": {
    "handle": "example.eth",
    "avatarUrl": "https://example.com/avatar.png"
  },
  "Lens": {
    "handle": "example.lens",
    "avatarUrl": "https://example.com/avatar.png"
  }
}
```

### Reverse Resolve Handle

**Endpoint:** `/api/reverse-resolve/:handle`

**Method:** `GET`

**Parameters:**

- `handle` (required): The handle to reverse resolve.
- `services` (optional): A comma-separated list of services to query. If not provided, all available resolvers will be used.

**Response:**

- `200 OK`: A JSON object containing the resolved addresses from the specified services.

**Example Request:**

```http
GET /api/reverse-resolve/example.eth?services=ENS,Lens
```

**Example Response:**

```json
{
  "ENS": "0x1234567890abcdef1234567890abcdef12345678",
  "Lens": "0xabcdefabcdefabcdefabcdefabcdefabcdef"
}
```

## Static Entries

Some addresses are known contracts rather than accounts with an ENS or Farcaster profile —
protocol contracts, game contracts, treasuries. These are declared as static data in
`app/static/` instead of being looked up over the network, and are served by
`app/resolvers/static.ts`.

A registry file is keyed by chain id, and each entry is already in the shape the API
returns:

```json
{
  "8453": [
    {
      "handle": "Moral Hazard SUP Game",
      "avatarUrl": "/assets/moralhazard-avatar.svg",
      "address": "0x1FF0cEbDabd7a216Ee3948AA050D6c6D6fD78F1E"
    }
  ],
  "84532": []
}
```

`avatarUrl` may be a path relative to this deployment (resolved against `BASE_URL`, so put
the image in `public/assets/`) or an absolute `https://` URL.

### Adding a project

1. Add `app/static/<project>.json` using the shape above. Chains with no entries yet can be
   left as empty arrays.
2. Register it in `REGISTRIES` in `app/resolvers/static.ts`:

   ```ts
   import myProject from "@/app/static/myproject.json"

   const REGISTRIES: { service: string; registry: StaticRegistry }[] = [
     { service: "MoralHazard", registry: moralHazard },
     { service: "MyProject", registry: myProject }
   ]
   ```

The `service` name becomes the key in the API response and the value accepted by the
`services` query parameter. Registries are imported statically because the edge runtime
cannot enumerate files at runtime.

Lookups are case-insensitive in both directions. Addresses are unique per registry, so
address lookup is exact; if the same handle appears on several chains, mainnet entries take
precedence over testnets when reverse-resolving a name.

## Development

### Setup

1. Clone the repository.
2. Install dependencies using `pnpm install`.
3. Start the development server using `pnpm run dev`.

## License

This project is licensed under the MIT License.