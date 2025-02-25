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

## Development

### Setup

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Start the development server using `npm run dev`.

## License

This project is licensed under the MIT License.