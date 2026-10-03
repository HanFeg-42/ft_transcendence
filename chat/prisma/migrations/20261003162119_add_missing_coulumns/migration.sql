-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN     "meta" JSONB,
ADD COLUMN     "readAt" TIMESTAMP(3);
