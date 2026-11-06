CREATE TABLE "DailySongPlay" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySongPlay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailySongPlay_songId_day_key" ON "DailySongPlay"("songId", "day");
CREATE INDEX "DailySongPlay_day_plays_idx" ON "DailySongPlay"("day", "plays");

ALTER TABLE "DailySongPlay" ADD CONSTRAINT "DailySongPlay_songId_fkey"
FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
