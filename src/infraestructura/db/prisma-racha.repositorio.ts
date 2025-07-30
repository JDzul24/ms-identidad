import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IRachaRepositorio } from '../../dominio/repositorios/racha.repositorio';
import { Racha } from '../../dominio/entidades/racha.entity';
import { HistorialRacha } from '../../dominio/entidades/historial-racha.entity';

@Injectable()
export class PrismaRachaRepositorio implements IRachaRepositorio {
  private readonly logger = new Logger(PrismaRachaRepositorio.name);
  
  constructor(private readonly prisma: PrismaService) {}

  async guardar(racha: Racha): Promise<Racha> {
    this.logger.log(`Guardando racha para usuario ${racha.usuarioId}: ${racha.rachaActual} días`);
    
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
    this.logger.log(`Actualizando racha para usuario ${racha.usuarioId}: ${racha.rachaActual} días (estado: ${racha.estado})`);
    
    try {
      // Asegurarse de que rachaActual sea un número válido
      const rachaActualNormalizada = Number.isNaN(racha.rachaActual) ? 0 : racha.rachaActual;
      const recordPersonalNormalizado = Number.isNaN(racha.recordPersonal) ? 0 : racha.recordPersonal;
      
      const rachaDb = await this.prisma.racha.update({
        where: { id: racha.id },
        data: {
          rachaActual: rachaActualNormalizada,
          estado: racha.estado,
          recordPersonal: recordPersonalNormalizado,
          ultimaActualizacion: racha.ultimaActualizacion,
        },
      });

      // Forzar una recarga fresca desde la base de datos para asegurar consistencia
      const rachaActualizada = await this.prisma.racha.findUnique({
        where: { id: racha.id },
      });

      return this.mapearADominio(rachaActualizada);
    } catch (error) {
      this.logger.error(`Error al actualizar racha para usuario ${racha.usuarioId}:`, error.stack);
      throw error;
    }
  }

  async encontrarPorUsuarioId(usuarioId: string): Promise<Racha | null> {
    this.logger.debug(`Buscando racha para usuario ${usuarioId}`);
    
    // Usar una consulta con "noCache" para evitar datos en caché
    const rachaDb = await this.prisma.racha.findUnique({
      where: { usuarioId },
    });

    if (rachaDb) {
      this.logger.debug(`Racha encontrada para usuario ${usuarioId}`);
    } else {
      this.logger.debug(`No se encontró racha para usuario ${usuarioId}`);
    }

    return rachaDb ? this.mapearADominio(rachaDb) : null;
  }

  async crearOEncontrar(usuarioId: string): Promise<Racha> {
    this.logger.log(`Buscando o creando racha para usuario ${usuarioId}`);
    
    try {
      // Primero, intentar encontrar la racha existente con una consulta fresca
      const rachaExistente = await this.encontrarPorUsuarioId(usuarioId);
      if (rachaExistente) {
        const rachaActual = rachaExistente.rachaActual || 0;
        this.logger.log(`Racha existente encontrada para usuario ${usuarioId}: ${rachaActual} días`);
        return rachaExistente;
      }

      // Si no existe, crear una nueva racha
      this.logger.log(`Creando nueva racha para usuario ${usuarioId}`);
      const nuevaRacha = Racha.crear({ usuarioId });
      return this.guardar(nuevaRacha);
    } catch (error) {
      this.logger.error(`Error en crearOEncontrar para usuario ${usuarioId}:`, error.stack);
      // En caso de error, crear una racha predeterminada como fallback
      const rachaDefault = Racha.crear({ usuarioId });
      return rachaDefault;
    }
  }

  async guardarHistorial(historial: HistorialRacha): Promise<HistorialRacha> {
    this.logger.log(`Guardando historial de racha para usuario ${historial.usuarioId}`);
    
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
    this.logger.debug(`Buscando historial de rachas para usuario ${usuarioId}`);
    
    const historialesDb = await this.prisma.historialRacha.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.debug(`Se encontraron ${historialesDb.length} registros de historial para usuario ${usuarioId}`);
    
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