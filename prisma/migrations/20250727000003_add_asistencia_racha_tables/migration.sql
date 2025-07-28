-- AlterTable
ALTER TABLE "users" ADD COLUMN "estado_atleta" TEXT DEFAULT 'pendiente_datos';
ALTER TABLE "users" ADD COLUMN "datos_fisicos_capturados" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN "fecha_aprobacion" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "asistencias" (
    "id" CHAR(36) NOT NULL,
    "gymId" CHAR(36) NOT NULL,
    "alumnoId" CHAR(36) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rachas" (
    "id" CHAR(36) NOT NULL,
    "usuarioId" CHAR(36) NOT NULL,
    "racha_actual" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "record_personal" INTEGER NOT NULL DEFAULT 0,
    "ultima_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rachas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_rachas" (
    "id" CHAR(36) NOT NULL,
    "usuarioId" CHAR(36) NOT NULL,
    "rachaId" CHAR(36) NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "duracion" INTEGER NOT NULL,
    "motivo_fin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_rachas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asistencias_gymId_alumnoId_fecha_key" ON "asistencias"("gymId", "alumnoId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "rachas_usuarioId_key" ON "rachas"("usuarioId");

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rachas" ADD CONSTRAINT "rachas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_rachas" ADD CONSTRAINT "historial_rachas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_rachas" ADD CONSTRAINT "historial_rachas_rachaId_fkey" FOREIGN KEY ("rachaId") REFERENCES "rachas"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 