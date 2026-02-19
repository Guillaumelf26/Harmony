-- CreateEnum
CREATE TYPE "LibraryRole" AS ENUM ('EDITOR');

-- CreateTable
CREATE TABLE "Library" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publicSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryMember" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "LibraryRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryInviteCode" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" "LibraryRole" NOT NULL DEFAULT 'EDITOR',
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryInviteCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Library_publicSlug_key" ON "Library"("publicSlug");

-- CreateIndex
CREATE INDEX "Library_ownerId_idx" ON "Library"("ownerId");

-- CreateIndex
CREATE INDEX "Library_publicSlug_idx" ON "Library"("publicSlug");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryMember_libraryId_userId_key" ON "LibraryMember"("libraryId", "userId");

-- CreateIndex
CREATE INDEX "LibraryMember_libraryId_idx" ON "LibraryMember"("libraryId");

-- CreateIndex
CREATE INDEX "LibraryMember_userId_idx" ON "LibraryMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryInviteCode_code_key" ON "LibraryInviteCode"("code");

-- CreateIndex
CREATE INDEX "LibraryInviteCode_libraryId_idx" ON "LibraryInviteCode"("libraryId");

-- CreateIndex
CREATE INDEX "LibraryInviteCode_code_idx" ON "LibraryInviteCode"("code");

-- AddForeignKey
ALTER TABLE "Library" ADD CONSTRAINT "Library_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryMember" ADD CONSTRAINT "LibraryMember_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryMember" ADD CONSTRAINT "LibraryMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryInviteCode" ADD CONSTRAINT "LibraryInviteCode_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create a default library for each user
INSERT INTO "Library" ("id", "name", "ownerId", "isPublic", "createdAt", "updatedAt")
SELECT 
    replace(gen_random_uuid()::text, '-', ''),
    'Mes chants',
    "id",
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User";

-- Add libraryId to Song (nullable first)
ALTER TABLE "Song" ADD COLUMN "libraryId" TEXT;

-- Assign all existing songs to the first user's library
UPDATE "Song" SET "libraryId" = (
    SELECT "id" FROM "Library" ORDER BY "createdAt" ASC LIMIT 1
)
WHERE "libraryId" IS NULL;

-- If no libraries exist (no users), we need a fallback - create a temp user and library
-- For safety: only run the NOT NULL constraint if we have songs with libraryId set
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Song" WHERE "libraryId" IS NULL) THEN
        -- Assign to first library (there should be at least one if we have users)
        UPDATE "Song" SET "libraryId" = (SELECT "id" FROM "Library" LIMIT 1) WHERE "libraryId" IS NULL;
    END IF;
END $$;

-- Make libraryId required
ALTER TABLE "Song" ALTER COLUMN "libraryId" SET NOT NULL;

-- Add foreign key
ALTER TABLE "Song" ADD CONSTRAINT "Song_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index
CREATE INDEX "Song_libraryId_idx" ON "Song"("libraryId");

-- Remove role from User
ALTER TABLE "User" DROP COLUMN "role";

-- Drop Role enum
DROP TYPE "Role";
