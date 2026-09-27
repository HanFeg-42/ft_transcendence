import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({
  path: "../.env",
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["CHAT_DATABASE_URL"],
  },
});