import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  Gym as PrismaGym,
  User as PrismaUser,
  Athlete as PrismaAthlete,
} from '@prisma/client';

import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { Gimnasio } from '../../dominio/entidades/gimnasio.entity';
// --- CORRECCIÓN DE IMPORTACIÓN ---
import {
  Usuario,
  RolUsuario,
} from '../../dominio/entidades/usuario.entity';
// Se importa PerfilAtletaDominio desde su fuente de verdad
import { PerfilAtletaDominio } from '../../dominio/tipos/tipos-dominio';
// --- FIN DE LA CORRECCIÓN ---


type PrismaUsuarioConPerfil = PrismaUser & {
  athleteProfile: PrismaAthlete | null;
  email_verificado: boolean; // <-- AÑADIR CAMPO FALTANTE AL TIPO
};

@Injectable()
export class PrismaGimnasioRepositorio implements IGimnasioRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  public async encontrarPorClave(claveGym: string): Promise<Gimnasio | null> {
    const gymDb = await this.prisma.gym.findUnique({
      where: { gymKey: claveGym },
    });

    return gymDb ? this.mapearGimnasioADominio(gymDb) : null;
  }

  public async obtenerMiembros(gymId: string): Promise<Usuario[]> {
    const relaciones = await this.prisma.userGymRelation.findMany({
      where: { gymId: gymId },
      include: {
        user: {
          include: {
            athleteProfile: true,
          },
        },
      },
    });

    return relaciones.map((rel) =>
      this.mapearUsuarioADominio(rel.user as PrismaUsuarioConPerfil),
    );
  }

  public async encontrarPorMiembroId(
    miembroId: string,
  ): Promise<Gimnasio | null> {
    const relacion = await this.prisma.userGymRelation.findFirst({
      where: { userId: miembroId },
    });

    if (!relacion) {
      return null;
    }

    const gymDb = await this.prisma.gym.findUnique({
      where: { id: relacion.gymId },
    });

    return gymDb ? this.mapearGimnasioADominio(gymDb) : null;
  }

  public async actualizarClave(
    ownerId: string,
    nuevaClave: string,
  ): Promise<Gimnasio> {
    try {
      const gimnasioActualizadoDb = await this.prisma.gym.update({
        where: { ownerId: ownerId },
        data: { gymKey: nuevaClave },
      });
      return this.mapearGimnasioADominio(gimnasioActualizadoDb);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `No se encontró un gimnasio propiedad del usuario con ID ${ownerId}.`,
        );
      }
      throw error;
    }
  }

  public async encontrarPorOwnerId(ownerId: string): Promise<Gimnasio | null> {
    const gymDb = await this.prisma.gym.findUnique({
      where: { ownerId: ownerId },
    });
    return gymDb ? this.mapearGimnasioADominio(gymDb) : null;
  }

  // Métodos para gestión interna de gimnasios
  public async obtenerTodos(): Promise<Gimnasio[]> {
    const gymsDb = await this.prisma.gym.findMany();
    return gymsDb.map(gym => this.mapearGimnasioADominio(gym));
  }

  public async encontrarPorId(id: string): Promise<Gimnasio | null> {
    const gymDb = await this.prisma.gym.findUnique({
      where: { id: id },
    });
    return gymDb ? this.mapearGimnasioADominio(gymDb) : null;
  }

  public async guardar(gimnasio: Gimnasio): Promise<Gimnasio> {
    const gymData = {
      id: gimnasio.id,
      ownerId: gimnasio.ownerId,
      name: gimnasio.nombre,
      size: gimnasio.tamaño,
      totalBoxers: gimnasio.totalBoxeadores,
      location: gimnasio.ubicacion,
      imageUrl: gimnasio.imagenUrl,
      gymKey: gimnasio.gymKey,
    };

    const gymDb = await this.prisma.gym.upsert({
      where: { id: gimnasio.id },
      update: gymData,
      create: gymData,
    });

    return this.mapearGimnasioADominio(gymDb);
  }

  public async obtenerUsuariosAsociados(gymId: string): Promise<Usuario[]> {
    const relaciones = await this.prisma.userGymRelation.findMany({
      where: { gymId: gymId },
      include: {
        user: {
          include: {
            athleteProfile: true,
          },
        },
      },
    });

    return relaciones.map((rel) =>
      this.mapearUsuarioADominio(rel.user as PrismaUsuarioConPerfil),
    );
  }

  public async eliminar(id: string): Promise<void> {
    await this.prisma.gym.delete({
      where: { id: id },
    });
  }

  public async eliminarRelacionesUsuarios(gymId: string): Promise<void> {
    await this.prisma.userGymRelation.deleteMany({
      where: { gymId: gymId },
    });
  }

  private mapearGimnasioADominio(persistencia: PrismaGym): Gimnasio {
    return Gimnasio.desdePersistencia({
      id: persistencia.id,
      ownerId: persistencia.ownerId,
      name: persistencia.name,
      size: persistencia.size,
      totalBoxers: persistencia.totalBoxers,
      location: persistencia.location,
      imageUrl: persistencia.imageUrl,
      gymKey: persistencia.gymKey,
    });
  }

  private mapearUsuarioADominio(usuarioDb: PrismaUsuarioConPerfil): Usuario {
    let perfilAtletaDominio: PerfilAtletaDominio | null = null;
    if (usuarioDb.athleteProfile) {
      perfilAtletaDominio = {
        nivel: usuarioDb.athleteProfile.level,
        alturaCm: usuarioDb.athleteProfile.height_cm,
        pesoKg: usuarioDb.athleteProfile.weight_kg,
        guardia: usuarioDb.athleteProfile.stance,
        alergias: usuarioDb.athleteProfile.allergies,
        contactoEmergenciaNombre:
          usuarioDb.athleteProfile.emergency_contact_name,
        contactoEmergenciaTelefono:
          usuarioDb.athleteProfile.emergency_contact_phone,
      };
    }

    return Usuario.desdePersistencia({
      id: usuarioDb.id,
      email: usuarioDb.email,
      passwordHash: usuarioDb.password_hash ?? '',
      refreshTokenHash: usuarioDb.refresh_token_hash,
      fcmToken: usuarioDb.fcm_token,
      nombre: usuarioDb.name,
      rol: usuarioDb.role as RolUsuario,
      createdAt: usuarioDb.createdAt,
      perfilAtleta: perfilAtletaDominio,
      gimnasio: null,
      emailVerificado: usuarioDb.email_verificado,
      // ✅ FIX: Incluir campos de estado del atleta
      estadoAtleta: usuarioDb.estado_atleta,
      datosFisicosCapturados: usuarioDb.datos_fisicos_capturados,
    });
  }
}
