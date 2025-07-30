import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IAsistenciaRepositorio } from '../../dominio/repositorios/asistencia.repositorio';
import { Asistencia } from '../../dominio/entidades/asistencia.entity';

@Injectable()
export class PrismaAsistenciaRepositorio implements IAsistenciaRepositorio {
  private readonly logger = new Logger(PrismaAsistenciaRepositorio.name);
  
  constructor(private readonly prisma: PrismaService) {}

  async guardar(asistencia: Asistencia): Promise<Asistencia> {
    try {
      // Intentar encontrar una asistencia existente para el mismo gym, alumno y fecha
      const existente = await this.encontrarPorGymAlumnoYFecha(
        asistencia.gymId, 
        asistencia.alumnoId, 
        asistencia.fecha
      );

      if (existente) {
        this.logger.log(`Actualizando asistencia existente para gymId=${asistencia.gymId}, alumnoId=${asistencia.alumnoId}, fecha=${asistencia.fecha}`);
        
        // Si existe, actualizarla
        const asistenciaDb = await this.prisma.asistencia.update({
          where: { id: existente.id },
          data: {
            status: asistencia.status,
            updatedAt: new Date(),
          },
        });

        return this.mapearADominio(asistenciaDb);
      } else {
        this.logger.log(`Creando nueva asistencia para gymId=${asistencia.gymId}, alumnoId=${asistencia.alumnoId}, fecha=${asistencia.fecha}`);
        
        // Si no existe, crearla
        const asistenciaDb = await this.prisma.asistencia.create({
          data: {
            id: asistencia.id,
            gymId: asistencia.gymId,
            alumnoId: asistencia.alumnoId,
            fecha: asistencia.fecha,
            status: asistencia.status,
            createdAt: asistencia.createdAt,
            updatedAt: asistencia.updatedAt,
          },
        });

        return this.mapearADominio(asistenciaDb);
      }
    } catch (error) {
      this.logger.error(
        `Error al guardar asistencia: gymId=${asistencia.gymId}, alumnoId=${asistencia.alumnoId}, fecha=${asistencia.fecha}`, 
        error.stack
      );
      
      // Intentar usar upsert como fallback en caso de error de concurrencia
      try {
        this.logger.log(`Intentando usar upsert como fallback`);
        const asistenciaDb = await this.prisma.asistencia.upsert({
          where: {
            gymId_alumnoId_fecha: {
              gymId: asistencia.gymId,
              alumnoId: asistencia.alumnoId,
              fecha: asistencia.fecha,
            }
          },
          update: {
            status: asistencia.status,
            updatedAt: new Date(),
          },
          create: {
            id: asistencia.id,
            gymId: asistencia.gymId,
            alumnoId: asistencia.alumnoId,
            fecha: asistencia.fecha,
            status: asistencia.status,
            createdAt: asistencia.createdAt,
            updatedAt: asistencia.updatedAt,
          }
        });
        
        return this.mapearADominio(asistenciaDb);
      } catch (fallbackError) {
        this.logger.error(`Error en fallback upsert:`, fallbackError.stack);
        throw fallbackError;
      }
    }
  }

  async guardarMultiples(asistencias: Asistencia[]): Promise<void> {
    const datosParaCrear = asistencias.map((asistencia) => ({
      id: asistencia.id,
      gymId: asistencia.gymId,
      alumnoId: asistencia.alumnoId,
      fecha: asistencia.fecha,
      status: asistencia.status,
      createdAt: asistencia.createdAt,
      updatedAt: asistencia.updatedAt,
    }));

    await this.prisma.asistencia.createMany({
      data: datosParaCrear,
      skipDuplicates: true,
    });
  }

  async actualizar(asistencia: Asistencia): Promise<Asistencia> {
    const asistenciaDb = await this.prisma.asistencia.update({
      where: { id: asistencia.id },
      data: {
        status: asistencia.status,
        updatedAt: asistencia.updatedAt,
      },
    });

    return this.mapearADominio(asistenciaDb);
  }

  async encontrarPorGymYFecha(gymId: string, fecha: Date): Promise<Asistencia[]> {
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setUTCHours(0, 0, 0, 0);

    const asistenciasDb = await this.prisma.asistencia.findMany({
      where: {
        gymId,
        fecha: fechaNormalizada,
      },
    });

    return asistenciasDb.map((asistencia) => this.mapearADominio(asistencia));
  }

  async encontrarPorAlumnoYFecha(alumnoId: string, fecha: Date): Promise<Asistencia | null> {
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setUTCHours(0, 0, 0, 0);

    const asistenciaDb = await this.prisma.asistencia.findFirst({
      where: {
        alumnoId,
        fecha: fechaNormalizada,
      },
    });

    return asistenciaDb ? this.mapearADominio(asistenciaDb) : null;
  }

  async encontrarPorGymAlumnoYFecha(
    gymId: string,
    alumnoId: string,
    fecha: Date,
  ): Promise<Asistencia | null> {
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setUTCHours(0, 0, 0, 0);

    const asistenciaDb = await this.prisma.asistencia.findFirst({
      where: {
        gymId,
        alumnoId,
        fecha: fechaNormalizada,
      },
    });

    return asistenciaDb ? this.mapearADominio(asistenciaDb) : null;
  }

  async eliminarPorGymAlumnoYFecha(gymId: string, alumnoId: string, fecha: Date): Promise<void> {
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setUTCHours(0, 0, 0, 0);

    await this.prisma.asistencia.deleteMany({
      where: {
        gymId,
        alumnoId,
        fecha: fechaNormalizada,
      },
    });
  }

  private mapearADominio(asistenciaDb: any): Asistencia {
    return Asistencia.desdePersistencia({
      id: asistenciaDb.id,
      gymId: asistenciaDb.gymId,
      alumnoId: asistenciaDb.alumnoId,
      fecha: asistenciaDb.fecha,
      status: asistenciaDb.status,
      createdAt: asistenciaDb.created_at || asistenciaDb.createdAt,
      updatedAt: asistenciaDb.updated_at || asistenciaDb.updatedAt,
    });
  }
} 