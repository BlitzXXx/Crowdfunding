const campaignMetadataSchema = {
  type: "object",
  required: ["campaignAddress", "factoryAddress", "title", "description"],
  properties: {
    campaignAddress: { type: "string", pattern: "^0x[a-fA-F0-9]{40}$" },
    factoryAddress: { type: "string", pattern: "^0x[a-fA-F0-9]{40}$" },
    chainId: { type: "integer", default: 11155111 },
    title: { type: "string", minLength: 3, maxLength: 120 },
    description: { type: "string", minLength: 10, maxLength: 10000 },
    category: {
      type: "string",
      enum: ["technology", "art", "music", "film", "games", "community", "environment", "other"],
    },
    imageUrl: { type: "string", format: "uri" },
    metadataCid: { type: "string" },
    websiteUrl: { type: "string", format: "uri" },
    twitterHandle: { type: "string", pattern: "^@?[A-Za-z0-9_]{1,15}$" },
  },
};

const errorResponse = {
  description: "Error response",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          error: { type: "string" },
          details: {},
        },
      },
    },
  },
};

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "CrowdChain Backend API",
    version: "1.0.0",
    description:
      "Off-chain services for the Web3 crowdfunding platform: campaign metadata CRUD, IPFS pinning via Pinata, and health monitoring.",
    license: { name: "MIT" },
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "health", description: "Service monitoring" },
    { name: "campaigns", description: "Campaign metadata (off-chain)" },
    { name: "ipfs", description: "Content pinning" },
    { name: "users", description: "User profiles" },
    { name: "search", description: "Search and discovery" },
    { name: "blockchain", description: "On-chain data and events" },
    { name: "monitoring", description: "Service health and metrics" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["health"],
        summary: "Service health and dependency status",
        responses: {
          "200": {
            description: "Health report (status: ok | degraded)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["ok", "degraded"] },
                    service: { type: "string" },
                    version: { type: "string" },
                    checks: { type: "object" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/campaigns": {
      get: {
        tags: ["campaigns"],
        summary: "List campaign metadata",
        parameters: [
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 50 } },
        ],
        responses: {
          "200": { description: "Paginated campaign metadata list" },
          "503": errorResponse,
        },
      },
      post: {
        tags: ["campaigns"],
        summary: "Create or update campaign metadata (upsert by address)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: campaignMetadataSchema } },
        },
        responses: {
          "201": { description: "Metadata stored" },
          "400": errorResponse,
          "503": errorResponse,
        },
      },
    },
    "/api/v1/campaigns/{address}": {
      parameters: [
        {
          name: "address",
          in: "path",
          required: true,
          schema: { type: "string", pattern: "^0x[a-fA-F0-9]{40}$" },
        },
      ],
      get: {
        tags: ["campaigns"],
        summary: "Get campaign metadata by on-chain address",
        responses: {
          "200": { description: "Campaign metadata" },
          "404": errorResponse,
          "503": errorResponse,
        },
      },
      patch: {
        tags: ["campaigns"],
        summary: "Update editable fields of campaign metadata",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                ...campaignMetadataSchema,
                required: [],
                properties: Object.fromEntries(
                  Object.entries(campaignMetadataSchema.properties).filter(
                    ([k]) => !["campaignAddress", "factoryAddress"].includes(k)
                  )
                ),
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated metadata" },
          "404": errorResponse,
          "503": errorResponse,
        },
      },
      delete: {
        tags: ["campaigns"],
        summary: "Delete campaign metadata",
        responses: {
          "204": { description: "Deleted" },
          "404": errorResponse,
          "503": errorResponse,
        },
      },
    },
    "/api/v1/ipfs/json": {
      post: {
        tags: ["ipfs"],
        summary: "Pin a JSON document to IPFS",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "object", additionalProperties: true },
                  name: { type: "string", maxLength: 100 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Pinned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    cid: { type: "string" },
                    size: { type: "integer" },
                    url: { type: "string" },
                  },
                },
              },
            },
          },
          "400": errorResponse,
          "503": errorResponse,
        },
      },
    },
    "/api/v1/ipfs/file": {
      post: {
        tags: ["ipfs"],
        summary: "Pin a binary file to IPFS (max 10 MB)",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Pinned successfully" },
          "400": errorResponse,
          "413": errorResponse,
          "503": errorResponse,
        },
      },
    },
    "/api/v1/users": {
      get: {
        tags: ["users"],
        summary: "List user profiles",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Search by name or address" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 50 } },
        ],
        responses: {
          "200": { description: "Paginated user profiles" },
          "503": errorResponse,
        },
      },
      post: {
        tags: ["users"],
        summary: "Create or update user profile",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["address"],
                properties: {
                  address: { type: "string", pattern: "^0x[a-fA-F0-9]{40}$" },
                  displayName: { type: "string", minLength: 1, maxLength: 50 },
                  bio: { type: "string", maxLength: 500 },
                  avatarUrl: { type: "string", format: "uri" },
                  websiteUrl: { type: "string", format: "uri" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Profile created" },
          "400": errorResponse,
          "503": errorResponse,
        },
      },
    },
    "/api/v1/users/{address}": {
      parameters: [
        { name: "address", in: "path", required: true, schema: { type: "string", pattern: "^0x[a-fA-F0-9]{40}$" } },
      ],
      get: {
        tags: ["users"],
        summary: "Get profile by wallet address",
        responses: {
          "200": { description: "User profile" },
          "404": errorResponse,
          "503": errorResponse,
        },
      },
      put: {
        tags: ["users"],
        summary: "Update user profile",
        responses: {
          "200": { description: "Updated profile" },
          "404": errorResponse,
          "503": errorResponse,
        },
      },
      patch: {
        tags: ["users"],
        summary: "Partial update of user profile",
        responses: {
          "200": { description: "Updated profile" },
          "404": errorResponse,
          "503": errorResponse,
        },
      },
      delete: {
        tags: ["users"],
        summary: "Delete user profile",
        responses: {
          "204": { description: "Deleted" },
          "404": errorResponse,
          "503": errorResponse,
        },
      },
    },
    "/api/v1/search/campaigns": {
      get: {
        tags: ["search"],
        summary: "Search and filter campaigns",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Search text" },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "state", in: "query", schema: { type: "string", enum: ["active", "successful", "failed", "cancelled"] } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "raised", "progress", "ending"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Search results" },
          "500": errorResponse,
        },
      },
    },
    "/api/v1/blockchain/status": {
      get: {
        tags: ["blockchain"],
        summary: "Blockchain connection status",
        responses: {
          "200": { description: "Chain connected" },
          "503": errorResponse,
        },
      },
    },
    "/api/v1/blockchain/campaigns": {
      get: {
        tags: ["blockchain"],
        summary: "List all on-chain campaigns",
        responses: {
          "200": { description: "Campaign list" },
          "500": errorResponse,
        },
      },
    },
    "/api/v1/blockchain/events": {
      get: {
        tags: ["blockchain"],
        summary: "Recent on-chain events",
        parameters: [
          { name: "fromBlock", in: "query", schema: { type: "string" } },
          { name: "toBlock", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Event list" },
          "500": errorResponse,
        },
      },
    },
    "/api/v1/blockchain/stats": {
      get: {
        tags: ["blockchain"],
        summary: "Platform statistics",
        responses: {
          "200": { description: "Aggregated stats" },
          "500": errorResponse,
        },
      },
    },
    "/api/v1/monitoring": {
      get: {
        tags: ["monitoring"],
        summary: "Comprehensive service health",
        responses: {
          "200": { description: "Health status with per-service checks" },
        },
      },
    },
    "/api/v1/monitoring/metrics": {
      get: {
        tags: ["monitoring"],
        summary: "Prometheus-compatible metrics",
        responses: {
          "200": { description: "Metrics in text/plain format" },
        },
      },
    },
  },
} as const;
