import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  INestApplication,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Este método se ejecuta una vez que el módulo ha sido inicializado.
  async onModuleInit() {
    await this.$connect();
  }

  // Este método se ejecuta justo antes de que el módulo sea destruido.
  // Es el lugar correcto para cerrar la conexión de la base de datos.
  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Este método registra un hook para que, cuando la aplicación NestJS se cierre,
  // se active el ciclo de vida de destrucción de módulos (y por tanto, onModuleDestroy).
  enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
