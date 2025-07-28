import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IAsistenciaRepositorio } from '../../dominio/repositorios/asistencia.repositorio';
import { Asistencia } from '../../dominio/entidades/asistencia.entity';

@Injectable()
export class PrismaAsistenciaRepositorio implements IAsistenciaRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(asistencia: Asistencia): Promise<Asistencia> {
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
      createdAt: asistenciaDb.created_at,
      updatedAt: asistenciaDb.updated_at,
    });
  }
} 