-- Add role request, profile visibility, anonymous-report preference, and verification status support.
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'BUSINESS_VISIBLE', 'ADMIN_ONLY');
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MODERATOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'REPORTER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EDUCATOR';

ALTER TABLE "users"
  ADD COLUMN "requestedAccountType" "UserRole",
  ADD COLUMN "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
  ADD COLUMN "allowAnonymousReports" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';
