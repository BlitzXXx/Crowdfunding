import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().optional(),
  SEPOLIA_RPC_URL: z.string().url().optional(),
  CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "CONTRACT_ADDRESS must be a 20-byte hex address")
    .optional(),
  PINATA_JWT: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "debug"])
    .default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
