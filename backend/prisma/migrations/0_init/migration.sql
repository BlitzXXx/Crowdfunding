-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "CampaignMetadata" (
    "id" TEXT NOT NULL,
    "campaignAddress" TEXT NOT NULL,
    "factoryAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "imageUrl" TEXT,
    "metadataCid" TEXT,
    "websiteUrl" TEXT,
    "twitterHandle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "websiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformStats" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "totalCampaigns" INTEGER NOT NULL DEFAULT 0,
    "activeCampaigns" INTEGER NOT NULL DEFAULT 0,
    "totalContributions" BIGINT NOT NULL DEFAULT 0,
    "totalVolumeWei" TEXT NOT NULL DEFAULT '0',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMetadata_campaignAddress_key" ON "CampaignMetadata"("campaignAddress");

-- CreateIndex
CREATE INDEX "CampaignMetadata_category_idx" ON "CampaignMetadata"("category");

-- CreateIndex
CREATE INDEX "CampaignMetadata_createdAt_idx" ON "CampaignMetadata"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_address_key" ON "UserProfile"("address");

-- CreateIndex
CREATE INDEX "UserProfile_displayName_idx" ON "UserProfile"("displayName");

