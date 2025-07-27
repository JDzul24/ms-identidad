-- AlterTable
ALTER TABLE "users" ADD COLUMN     "confirmation_token" TEXT,
ADD COLUMN     "confirmation_token_expires_at" TIMESTAMP(3); 