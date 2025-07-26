import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MsIdentidadModule } from './ms-identidad';
import { PrismaService } from './infraestructura/db/prisma.service';

/**
 * Función de arranque (bootstrap) para el microservicio de Identidad.
 */
async function bootstrap() {
  const app = await NestFactory.create(MsIdentidadModule);

  // --- CORRECCIÓN 1: Habilitar CORS explícitamente ---
  // Se configura la política de CORS para permitir peticiones desde el entorno
  // de desarrollo local de Flutter y cualquier otro origen.
  app.enableCors({
    origin: '*', // Permite cualquier origen para máxima flexibilidad en desarrollo.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,Accept',
  });

  // --- CORRECCIÓN 2: Establecer el Prefijo Global de la API ---
  // Todas las rutas definidas en los controladores ahora tendrán el prefijo '/v1'.
  // Ejemplo: @Controller('users') -> /v1/users
  app.setGlobalPrefix('/v1');

  // Se mantiene el ValidationPipe global.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Se mantiene la gestión de shutdown hooks para Prisma.
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Se inicia el servidor.
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}

// Ejecuta la función de arranque
void bootstrap();
