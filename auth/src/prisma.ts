// only responsibility is connecting Prisma Client to PostgreSQL.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

// Use PostgreSQL, and here is how to reach it.
const adapter = new PrismaPg({ connectionString });

// This creates the object we'll actually use to query the database.
const prisma = new PrismaClient({ adapter });

// means other files can reuse this connection: by import { prisma } from "./prisma.js";
export { prisma };