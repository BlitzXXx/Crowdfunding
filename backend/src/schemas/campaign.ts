import { z } from "zod";

export const HEX_ADDRESS = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a 20-byte hex address");

export const createCampaignMetadataSchema = z.object({
  campaignAddress: HEX_ADDRESS,
  factoryAddress: HEX_ADDRESS,
  chainId: z.number().int().positive().default(11155111),
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(10_000),
  category: z
    .enum([
      "technology",
      "art",
      "music",
      "film",
      "games",
      "community",
      "environment",
      "other",
    ])
    .optional(),
  imageUrl: z.string().url().optional(),
  metadataCid: z.string().min(1).max(100).optional(),
  websiteUrl: z.string().url().optional(),
  twitterHandle: z
    .string()
    .regex(/^@?[A-Za-z0-9_]{1,15}$/, "Invalid Twitter handle")
    .optional(),
});

export const updateCampaignMetadataSchema = createCampaignMetadataSchema
  .omit({ campaignAddress: true, factoryAddress: true })
  .partial();

export type CreateCampaignMetadataInput = z.infer<
  typeof createCampaignMetadataSchema
>;
export type UpdateCampaignMetadataInput = z.infer<
  typeof updateCampaignMetadataSchema
>;
