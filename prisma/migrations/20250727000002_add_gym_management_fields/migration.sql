-- Agregar campos para gestión de gimnasios
ALTER TABLE "gyms" ADD COLUMN "size" TEXT DEFAULT 'mediano';
ALTER TABLE "gyms" ADD COLUMN "total_boxers" INTEGER DEFAULT 0;
ALTER TABLE "gyms" ADD COLUMN "location" TEXT;
ALTER TABLE "gyms" ADD COLUMN "image_url" TEXT; 