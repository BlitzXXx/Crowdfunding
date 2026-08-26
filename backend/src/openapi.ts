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
  },
} as const;
