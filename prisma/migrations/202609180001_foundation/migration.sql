-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "TabStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'VERIFIED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotationType" AS ENUM ('DRUM_TAB', 'STANDARD');

-- CreateEnum
CREATE TYPE "Instrument" AS ENUM ('KICK', 'SNARE', 'HI_HAT', 'OPEN_HI_HAT', 'CRASH', 'RIDE', 'TOM_HIGH', 'TOM_MID', 'FLOOR_TOM', 'CHINA', 'SPLASH');

-- CreateEnum
CREATE TYPE "Articulation" AS ENUM ('NORMAL', 'GHOST', 'RIMSHOT', 'CROSS_STICK', 'ACCENT', 'BELL');

-- CreateEnum
CREATE TYPE "AudioTrackType" AS ENUM ('ORIGINAL', 'DRUMLESS', 'CLICK', 'BACKING', 'STEM');

-- CreateEnum
CREATE TYPE "StemType" AS ENUM ('VOCALS', 'GUITAR', 'BASS', 'DRUMS', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "bpm" DOUBLE PRECISION NOT NULL,
    "timeSignatureNumerator" INTEGER NOT NULL DEFAULT 4,
    "timeSignatureDenominator" INTEGER NOT NULL DEFAULT 4,
    "difficulty" "Difficulty" NOT NULL,
    "coverImage" TEXT,
    "releaseYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tab" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "difficulty" "Difficulty" NOT NULL,
    "notationType" "NotationType" NOT NULL DEFAULT 'DRUM_TAB',
    "authorId" TEXT,
    "status" "TabStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measure" (
    "id" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "globalOrder" INTEGER NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,
    "numerator" INTEGER NOT NULL,
    "denominator" INTEGER NOT NULL,

    CONSTRAINT "Measure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrumEvent" (
    "id" TEXT NOT NULL,
    "measureId" TEXT NOT NULL,
    "instrument" "Instrument" NOT NULL,
    "beat" INTEGER NOT NULL,
    "subdivision" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "velocity" INTEGER NOT NULL DEFAULT 100,
    "articulation" "Articulation" NOT NULL DEFAULT 'NORMAL',

    CONSTRAINT "DrumEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioTrack" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AudioTrackType" NOT NULL,
    "stem" "StemType",
    "url" TEXT NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "offset" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "license" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "attribution" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "userId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","songId")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averagePlaybackRate" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");

-- CreateIndex
CREATE INDEX "Song_title_idx" ON "Song"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Song_artistId_slug_key" ON "Song"("artistId", "slug");

-- CreateIndex
CREATE INDEX "Tab_authorId_idx" ON "Tab"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "Tab_songId_version_key" ON "Tab"("songId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Tab_id_songId_key" ON "Tab"("id", "songId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_tabId_order_key" ON "Section"("tabId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Section_id_tabId_key" ON "Section"("id", "tabId");

-- CreateIndex
CREATE UNIQUE INDEX "Measure_sectionId_order_key" ON "Measure"("sectionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Measure_tabId_globalOrder_key" ON "Measure"("tabId", "globalOrder");

-- CreateIndex
CREATE INDEX "DrumEvent_measureId_idx" ON "DrumEvent"("measureId");

-- CreateIndex
CREATE INDEX "AudioTrack_songId_idx" ON "AudioTrack"("songId");

-- CreateIndex
CREATE INDEX "Favorite_songId_idx" ON "Favorite"("songId");

-- CreateIndex
CREATE INDEX "PracticeSession_userId_startedAt_idx" ON "PracticeSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "PracticeSession_tabId_songId_idx" ON "PracticeSession"("tabId", "songId");

-- CreateIndex
CREATE INDEX "PracticeSession_songId_idx" ON "PracticeSession"("songId");

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tab" ADD CONSTRAINT "Tab_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tab" ADD CONSTRAINT "Tab_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "Tab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measure" ADD CONSTRAINT "Measure_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "Tab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measure" ADD CONSTRAINT "Measure_sectionId_tabId_fkey" FOREIGN KEY ("sectionId", "tabId") REFERENCES "Section"("id", "tabId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrumEvent" ADD CONSTRAINT "DrumEvent_measureId_fkey" FOREIGN KEY ("measureId") REFERENCES "Measure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioTrack" ADD CONSTRAINT "AudioTrack_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_tabId_songId_fkey" FOREIGN KEY ("tabId", "songId") REFERENCES "Tab"("id", "songId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Local invariants. Cross-row timeline validation belongs to the domain service.
ALTER TABLE "Song" ADD CONSTRAINT "Song_musical_values_check" CHECK (
  "duration" > 0 AND "duration" < 'Infinity'::float8 AND
  "bpm" > 0 AND "bpm" < 'Infinity'::float8 AND
  "timeSignatureNumerator" > 0 AND "timeSignatureDenominator" IN (1, 2, 4, 8, 16, 32)
);
ALTER TABLE "Tab" ADD CONSTRAINT "Tab_version_check" CHECK ("version" > 0);
ALTER TABLE "Section" ADD CONSTRAINT "Section_interval_check" CHECK (
  "order" > 0 AND "startTime" >= 0 AND "endTime" > "startTime" AND "endTime" < 'Infinity'::float8
);
ALTER TABLE "Measure" ADD CONSTRAINT "Measure_values_check" CHECK (
  "order" > 0 AND "globalOrder" > 0 AND "startTime" >= 0 AND
  "endTime" > "startTime" AND "endTime" < 'Infinity'::float8 AND
  "numerator" > 0 AND "denominator" IN (1, 2, 4, 8, 16, 32)
);
ALTER TABLE "DrumEvent" ADD CONSTRAINT "DrumEvent_values_check" CHECK (
  "beat" > 0 AND "subdivision" >= 0 AND "subdivision" < 1 AND "velocity" BETWEEN 1 AND 127
);
ALTER TABLE "AudioTrack" ADD CONSTRAINT "AudioTrack_values_check" CHECK (
  "duration" > 0 AND "duration" < 'Infinity'::float8 AND
  "offset" > '-Infinity'::float8 AND "offset" < 'Infinity'::float8 AND
  length(trim("license")) > 0 AND length(trim("source")) > 0 AND length(trim("attribution")) > 0 AND
  (("type" = 'STEM' AND "stem" IS NOT NULL) OR ("type" <> 'STEM' AND "stem" IS NULL))
);
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_values_check" CHECK (
  "duration" >= 0 AND "duration" < 'Infinity'::float8 AND
  "averagePlaybackRate" > 0 AND "averagePlaybackRate" < 'Infinity'::float8 AND
  ("endedAt" IS NULL OR "endedAt" >= "startedAt")
);
