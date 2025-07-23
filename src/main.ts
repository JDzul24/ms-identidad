import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MsIdentidadModule } from './ms-identidad';
import { PrismaService } from './infraestructura/db/prisma.service';

/**
 * Función de arranque (bootstrap) para el microservicio de Identidad.
 * Este es el punto de entrada de la aplicación.
 */
async function bootstrap() {
  // Crea la instancia de la aplicación NestJS
  const app = await NestFactory.create(MsIdentidadModule);

  // Habilita un ValidationPipe global para todos los DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Habilita los 'shutdown hooks' para un cierre seguro
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Inicia el servidor
  await app.listen(process.env.PORT || 3000);
}

// Ejecuta la función de arranque
bootstrap();
