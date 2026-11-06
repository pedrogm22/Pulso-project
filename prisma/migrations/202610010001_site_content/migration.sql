CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "topMessage" VARCHAR(500) NOT NULL,
    "blogPosts" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);
