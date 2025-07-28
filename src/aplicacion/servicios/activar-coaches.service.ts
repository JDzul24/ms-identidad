import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infraestructura/db/prisma.service';

@Injectable()
export class ActivarCoachesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async ejecutar(): Promise<{ coachesActivados: number; coachesYaActivos: number }> {
    // Actualizar coaches existentes que estén en estado pendiente
    const resultado = await this.prisma.user.updateMany({
      where: {
        role: {
          in: ['Entrenador', 'Admin']
        },
        estado_atleta: 'pendiente_datos'
      },
      data: {
        estado_atleta: 'activo',
        datos_fisicos_capturados: true,
        fecha_aprobacion: new Date()
      }
    });

    // Contar coaches que ya estaban activos
    const coachesYaActivos = await this.prisma.user.count({
      where: {
        role: {
          in: ['Entrenador', 'Admin']
        },
        estado_atleta: 'activo'
      }
    });

    return {
      coachesActivados: resultado.count,
      coachesYaActivos: coachesYaActivos
    };
  }
} 