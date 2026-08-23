import { PrismaClient } from "@prisma/client";

let client: PrismaClient | null = null;

/**
 * Lazily instantiate the Prisma client so the API can boot (and serve
 * health/static endpoints) even when no database is configured yet.
 */
export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!client) {
    client = new PrismaClient();
  }
  return client;
}

export async function disconnectPrisma(): Promise<void> {
  if (client) {
    await client.$disconnect();
    client = null;
  }
}
