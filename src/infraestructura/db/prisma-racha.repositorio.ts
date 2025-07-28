import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IRachaRepositorio } from '../../dominio/repositorios/racha.repositorio';
import { Racha } from '../../dominio/entidades/racha.entity';
import { HistorialRacha } from '../../dominio/entidades/historial-racha.entity';

@Injectable()
export class PrismaRachaRepositorio implements IRachaRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(racha: Racha): Promise<Racha> {
    const rachaDb = await this.prisma.racha.create({
      data: {
        id: racha.id,
        usuarioId: racha.usuarioId,
        rachaActual: racha.rachaActual,
        estado: racha.estado,
        recordPersonal: racha.recordPersonal,
        ultimaActualizacion: racha.ultimaActualizacion,
        createdAt: racha.createdAt,
      },
    });

    return this.mapearADominio(rachaDb);
  }

  async actualizar(racha: Racha): Promise<Racha> {
    const rachaDb = await this.prisma.racha.update({
      where: { id: racha.id },
      data: {
        rachaActual: racha.rachaActual,
        estado: racha.estado,
        recordPersonal: racha.recordPersonal,
        ultimaActualizacion: racha.ultimaActualizacion,
      },
    });

    return this.mapearADominio(rachaDb);
  }

  async encontrarPorUsuarioId(usuarioId: string): Promise<Racha | null> {
    const rachaDb = await this.prisma.racha.findUnique({
      where: { usuarioId },
    });

    return rachaDb ? this.mapearADominio(rachaDb) : null;
  }

  async crearOEncontrar(usuarioId: string): Promise<Racha> {
    const rachaExistente = await this.encontrarPorUsuarioId(usuarioId);
    if (rachaExistente) {
      return rachaExistente;
    }

    const nuevaRacha = Racha.crear({ usuarioId });
    return this.guardar(nuevaRacha);
  }

  async guardarHistorial(historial: HistorialRacha): Promise<HistorialRacha> {
    const historialDb = await this.prisma.historialRacha.create({
      data: {
        id: historial.id,
        usuarioId: historial.usuarioId,
        rachaId: historial.rachaId,
        inicio: historial.inicio,
        fin: historial.fin,
        duracion: historial.duracion,
        motivoFin: historial.motivoFin,
        createdAt: historial.createdAt,
      },
    });

    return this.mapearHistorialADominio(historialDb);
  }

  async encontrarHistorialPorUsuarioId(usuarioId: string): Promise<HistorialRacha[]> {
    const historialesDb = await this.prisma.historialRacha.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
    });

    return historialesDb.map((historial) => this.mapearHistorialADominio(historial));
  }

  private mapearADominio(rachaDb: any): Racha {
    return Racha.desdePersistencia({
      id: rachaDb.id,
      usuarioId: rachaDb.usuarioId,
      rachaActual: rachaDb.racha_actual,
      estado: rachaDb.estado,
      recordPersonal: rachaDb.record_personal,
      ultimaActualizacion: rachaDb.ultima_actualizacion,
      createdAt: rachaDb.created_at,
    });
  }

  private mapearHistorialADominio(historialDb: any): HistorialRacha {
    return HistorialRacha.desdePersistencia({
      id: historialDb.id,
      usuarioId: historialDb.usuarioId,
      rachaId: historialDb.rachaId,
      inicio: historialDb.inicio,
      fin: historialDb.fin,
      duracion: historialDb.duracion,
      motivoFin: historialDb.motivo_fin,
      createdAt: historialDb.created_at,
    });
  }
} 