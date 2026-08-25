import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let dbInstance: PrismaClient;

if (globalForPrisma.prisma) {
  dbInstance = globalForPrisma.prisma;
} else {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing");
  }

  // Create a pg Connection Pool
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Instantiate client using PostgreSQL Driver Adapter
  const adapter = new PrismaPg(pool);
  dbInstance = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = dbInstance;
  }
}

export const db = dbInstance;
