-- CreateTable
CREATE TABLE "public"."admin_sessions" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_access" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_key" ON "public"."admin_sessions"("token");

-- CreateIndex
CREATE INDEX "admin_sessions_expires_at_idx" ON "public"."admin_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "admin_sessions_last_access_idx" ON "public"."admin_sessions"("last_access");
