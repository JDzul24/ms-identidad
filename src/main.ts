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
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0:80');
  console.log(`La aplicación está escuchando en el puerto ${port}`);
}

// Ejecuta la función de arranque
bootstrap();
