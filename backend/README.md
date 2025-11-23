# Backend Services (Phase 3)

This directory contains the off-chain backend services for the Crowdfunding DApp.

## 🎯 Phase 3 Overview

**Goal**: Build REST API and IPFS integration for enhanced UX

**Duration**: 1 week

**Key Deliverables**:
- REST API with full endpoints
- IPFS integration for metadata and media
- PostgreSQL database
- Blockchain event listener
- API documentation

## 📁 Directory Structure

```
backend/
├── src/
│   ├── routes/              # API routes
│   │   ├── campaigns.ts    # Campaign endpoints
│   │   ├── ipfs.ts         # IPFS upload/retrieval
│   │   ├── users.ts        # User profiles
│   │   └── stats.ts        # Statistics
│   │
│   ├── controllers/         # Route controllers
│   │   ├── campaignController.ts
│   │   ├── ipfsController.ts
│   │   └── userController.ts
│   │
│   ├── services/            # Business logic
│   │   ├── ipfsService.ts
│   │   ├── blockchainService.ts
│   │   └── cacheService.ts
│   │
│   ├── models/              # Data models
│   │   ├── campaign.model.ts
│   │   └── user.model.ts
│   │
│   ├── middleware/          # Express middleware
│   │   ├── errorHandler.ts
│   │   ├── validation.ts
│   │   └── rateLimit.ts
│   │
│   ├── utils/               # Utilities
│   │   ├── logger.ts
│   │   └── helpers.ts
│   │
│   ├── config/              # Configuration
│   │   ├── database.ts
│   │   └── blockchain.ts
│   │
│   └── app.ts               # Express app setup
│
├── prisma/                  # Prisma ORM
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
│
├── tests/                   # API tests
│   ├── campaigns.test.ts
│   └── ipfs.test.ts
│
├── .env.example            # Environment template
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies
```

## 🚀 Getting Started

### 1. Initialize Node.js Project

```bash
cd backend
npm init -y
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install express cors dotenv
npm install ethers@6 # For blockchain interaction
npm install @pinata/sdk # or ipfs-http-client
npm install @prisma/client

# Development dependencies
npm install --save-dev typescript @types/node @types/express
npm install --save-dev ts-node nodemon
npm install --save-dev prisma
```

### 3. Initialize TypeScript

```bash
npx tsc --init
```

### 4. Set Up Prisma

```bash
npx prisma init
```

### 5. Configure Environment Variables

Create `.env` file:
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crowdfunding"

# Blockchain
SEPOLIA_RPC_URL=your_rpc_url
CONTRACT_ADDRESS=your_deployed_factory_address

# IPFS (Pinata)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

## 📝 API Endpoints

### Campaign Endpoints

#### GET /api/campaigns
Get all campaigns with pagination and filters
```json
{
  "page": 1,
  "limit": 20,
  "category": "technology",
  "status": "active"
}
```

#### GET /api/campaigns/:id
Get campaign details by ID

#### POST /api/campaigns/metadata
Store campaign metadata
```json
{
  "title": "My Campaign",
  "description": "Campaign description",
  "category": "technology",
  "rewards": [...],
  "ipfsHash": "Qm..."
}
```

#### GET /api/campaigns/creator/:address
Get campaigns by creator address

#### GET /api/campaigns/:id/statistics
Get campaign statistics

### IPFS Endpoints

#### POST /api/ipfs/upload
Upload file to IPFS
```
Content-Type: multipart/form-data
file: [binary]
```

Response:
```json
{
  "ipfsHash": "QmXxx...",
  "url": "https://gateway.pinata.cloud/ipfs/QmXxx..."
}
```

#### POST /api/ipfs/upload-json
Upload JSON metadata to IPFS
```json
{
  "title": "Campaign Title",
  "description": "Description",
  "image": "ipfs://Qm..."
}
```

#### GET /api/ipfs/:hash
Retrieve content from IPFS

### User Endpoints

#### GET /api/users/:address
Get user profile

#### POST /api/users/:address
Create/update user profile

#### GET /api/users/:address/contributions
Get user contribution history

### Statistics Endpoints

#### GET /api/stats/global
Get global platform statistics

#### GET /api/stats/trending
Get trending campaigns

## 🗄️ Database Schema

### Prisma Schema Example

```prisma
model Campaign {
  id              String   @id @default(uuid())
  contractAddress String   @unique
  creatorAddress  String
  title           String
  description     String
  category        String
  goal            String   // BigInt as string
  deadline        DateTime
  ipfsHash        String
  imageUrl        String?
  status          String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  contributions   Contribution[]

  @@index([creatorAddress])
  @@index([category])
  @@index([status])
}

model Contribution {
  id              String   @id @default(uuid())
  campaignId      String
  contributorAddress String
  amount          String   // BigInt as string
  timestamp       DateTime
  txHash          String   @unique

  campaign        Campaign @relation(fields: [campaignId], references: [id])

  @@index([campaignId])
  @@index([contributorAddress])
}

model User {
  id              String   @id @default(uuid())
  address         String   @unique
  username        String?
  bio             String?
  avatar          String?
  createdAt       DateTime @default(now())

  @@index([address])
}
```

## 🔗 Blockchain Integration

### Event Listener Service

```typescript
// services/blockchainService.ts
class BlockchainService {
  async listenToEvents() {
    // Listen for CampaignCreated events
    // Update database when events are emitted
    // Handle reorgs
  }

  async getCampaignFromChain(address: string) {
    // Read campaign data from smart contract
  }
}
```

### Key Features
- Listen to contract events in real-time
- Sync blockchain state with database
- Handle chain reorganizations
- Provide cached data for fast queries

## 📤 IPFS Integration

### Upload Service

```typescript
// services/ipfsService.ts
class IPFSService {
  async uploadFile(file: Buffer): Promise<string> {
    // Upload to Pinata/IPFS
    // Return IPFS hash
  }

  async uploadJSON(data: object): Promise<string> {
    // Upload JSON metadata
    // Return IPFS hash
  }

  async getContent(hash: string): Promise<any> {
    // Retrieve from IPFS
    // Cache for performance
  }
}
```

### Metadata Standard

```json
{
  "version": "1.0",
  "title": "Campaign Title",
  "description": "Detailed description",
  "category": "technology",
  "image": "ipfs://QmImage...",
  "video": "ipfs://QmVideo...",
  "rewards": [
    {
      "tier": 1,
      "amount": "0.1",
      "description": "Tier 1 reward",
      "items": ["Digital thank you"]
    }
  ],
  "team": [
    {
      "name": "Creator Name",
      "role": "Founder",
      "bio": "..."
    }
  ],
  "milestones": [
    {
      "goal": "1 ETH",
      "description": "First milestone"
    }
  ]
}
```

## 🧪 Testing

### Test Structure
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test campaigns.test.ts
```

### Example Test
```typescript
describe('Campaign API', () => {
  it('should create campaign metadata', async () => {
    const response = await request(app)
      .post('/api/campaigns/metadata')
      .send({
        title: 'Test Campaign',
        description: 'Test description'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

## 🚀 Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### With Docker
```bash
docker-compose up
```

## 📊 Phase 3 Checklist

- [ ] Node.js project initialized
- [ ] TypeScript configured
- [ ] Express server setup
- [ ] Database schema designed
- [ ] Prisma migrations created
- [ ] IPFS service implemented
- [ ] Blockchain service implemented
- [ ] Campaign endpoints implemented
- [ ] User endpoints implemented
- [ ] IPFS endpoints implemented
- [ ] Error handling middleware
- [ ] Request validation
- [ ] API documentation (Swagger)
- [ ] Tests written
- [ ] Environment configuration
- [ ] Rate limiting implemented
- [ ] Logging setup
- [ ] Local testing complete

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Pinata Documentation](https://docs.pinata.cloud/)
- [ethers.js Documentation](https://docs.ethers.org/)

## 🔜 Next Phase

Once Phase 3 is complete, you can proceed to:
- **Phase 4**: Indexing & Subgraph
- **Phase 5**: Frontend (requires Phase 4 complete)

---

**Status**: 🔴 Not Started

Ready when you complete Phase 2!
