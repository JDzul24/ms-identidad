import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ISolicitudRepositorio } from '../../dominio/repositorios/solicitud.repositorio';
import { SolicitudDatos } from '../../dominio/entidades/solicitud-datos.entity';
import { AthleteDataCaptureRequest } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class PrismaSolicitudRepositorio implements ISolicitudRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  public async guardar(solicitud: SolicitudDatos): Promise<void> {
    await this.prisma.athleteDataCaptureRequest.create({
      data: {
        id: solicitud.id,
        athleteId: solicitud.atletaId,
        coachId: solicitud.coachId,
        status: solicitud.status,
        requestedAt: solicitud.requestedAt,
      },
    });
  }

  public async encontrarPendientesPorEntrenador(
    coachId: string,
  ): Promise<SolicitudDatos[]> {
    const solicitudesDb = await this.prisma.athleteDataCaptureRequest.findMany({
      where: {
        coachId: coachId,
        status: 'PENDIENTE',
      },
      include: {
        athlete: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });

    return solicitudesDb.map((solicitud) =>
      this.mapearADominio(
        solicitud as any,
      ), // 'as any' para acomodar el tipo del include
    );
  }

  public async encontrarPorIdAtleta(
    atletaId: string,
  ): Promise<SolicitudDatos | null> {
    const solicitudDb = await this.prisma.athleteDataCaptureRequest.findFirst({
      where: { athleteId: atletaId, status: 'PENDIENTE' }, // Buscamos solo las pendientes
    });

    if (!solicitudDb) {
      return null;
    }

    return this.mapearADominio(solicitudDb);
  }

  public async actualizar(solicitud: SolicitudDatos): Promise<void> {
    await this.prisma.athleteDataCaptureRequest.update({
      where: { id: solicitud.id },
      data: {
        status: solicitud.status,
      },
    });
  }

  public async eliminar(id: string): Promise<void> {
    await this.prisma.athleteDataCaptureRequest.delete({
      where: { id },
    });
  }

  public async crear(datos: {
    atletaId: string;
    coachId: string;
    status: 'PENDIENTE' | 'COMPLETADA';
    requestedAt: Date;
  }): Promise<SolicitudDatos> {
    const solicitudDb = await this.prisma.athleteDataCaptureRequest.create({
      data: {
        id: randomUUID(),
        athleteId: datos.atletaId,
        coachId: datos.coachId,
        status: datos.status,
        requestedAt: datos.requestedAt,
      },
    });

    return this.mapearADominio(solicitudDb);
  }

  private mapearADominio(
    persistencia: AthleteDataCaptureRequest & {
      athlete?: { name: string; email: string };
    },
  ): SolicitudDatos {
    return SolicitudDatos.desdePersistencia({
      id: persistencia.id,
      atletaId: persistencia.athleteId,
      coachId: persistencia.coachId,
      status: persistencia.status as 'PENDIENTE' | 'COMPLETADA',
      requestedAt: persistencia.requestedAt,
      nombreAtleta: persistencia.athlete?.name,
      emailAtleta: persistencia.athlete?.email,
    });
  }
}
