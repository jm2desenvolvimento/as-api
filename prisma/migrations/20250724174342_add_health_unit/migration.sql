-- CreateTable
CREATE TABLE "health_unit" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "city_hall_id" INTEGER NOT NULL,

    CONSTRAINT "health_unit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "health_unit" ADD CONSTRAINT "health_unit_city_hall_id_fkey" FOREIGN KEY ("city_hall_id") REFERENCES "city_hall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
