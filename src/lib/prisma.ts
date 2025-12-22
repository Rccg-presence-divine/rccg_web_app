import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Fonction pour obtenir DATABASE_URL
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    console.error('DATABASE_URL is not defined in environment variables');
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  return url;
}

// Créer le pool de connexions
const getPool = (): Pool => {
  if (!globalForPrisma.pool) {
    const databaseUrl = getDatabaseUrl();
    
    globalForPrisma.pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  
  return globalForPrisma.pool;
};

// Créer le client Prisma
const createPrismaClient = (): PrismaClient => {
  const pool = getPool();
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
};

const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;