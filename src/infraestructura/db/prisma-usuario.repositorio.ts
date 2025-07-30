import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';
import { User, Athlete, Gym } from '@prisma/client';

import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
// --- CORRECCIÓN DE IMPORTACIÓN ---
import {
  PerfilAtletaActualizable,
  PerfilAtletaDominio,
  GimnasioDominio,
} from '../../dominio/tipos/tipos-dominio';
import {
  Usuario,
  RolUsuario,
} from '../../dominio/entidades/usuario.entity';
// --- FIN DE LA CORRECCIÓN ---


// Tipo local para la respuesta enriquecida de Prisma
type UsuarioConPerfilCompleto = User & {
  athleteProfile: Athlete | null;
  ownedGym: Gym | null;
  gyms: ({ gym: Gym })[];
};

@Injectable()
export class PrismaUsuarioRepositorio implements IUsuarioRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  public async encontrarPorEmail(email: string): Promise<Usuario | null> {
    const usuarioDb = await this.prisma.user.findUnique({
      where: { email },
      include: {
        athleteProfile: true,
        ownedGym: true,
        gyms: { include: { gym: true } },
      },
    });
    return usuarioDb ? this.mapearADominio(usuarioDb) : null;
  }

  public async encontrarPorId(id: string): Promise<Usuario | null> {
    const usuarioDb = await this.prisma.user.findUnique({
      where: { id },
      include: {
        athleteProfile: true,
        ownedGym: true,
        gyms: { include: { gym: true } },
      },
    });
    return usuarioDb ? this.mapearADominio(usuarioDb) : null;
  }

  public async guardar(usuario: Usuario): Promise<Usuario> {
    const usuarioGuardadoDb = await this.prisma.user.upsert({
      where: { id: usuario.id },
      update: {
        email: usuario.email,
        password_hash: usuario.obtenerPasswordHash(),
        name: usuario.nombre,
        role: usuario.rol,
        refresh_token_hash: usuario.refreshTokenHash,
        fcm_token: usuario.fcmToken,
        email_verificado: usuario.estaVerificado(),
        estado_atleta: usuario.estadoAtleta,
        datos_fisicos_capturados: usuario.datosFisicosCapturados,
      },
      create: {
        id: usuario.id,
        email: usuario.email,
        password_hash: usuario.obtenerPasswordHash(),
        name: usuario.nombre,
        role: usuario.rol,
        refresh_token_hash: usuario.refreshTokenHash,
        fcm_token: usuario.fcmToken,
        email_verificado: usuario.estaVerificado(),
        estado_atleta: usuario.estadoAtleta,
        datos_fisicos_capturados: usuario.datosFisicosCapturados,
      },
    });
    const usuarioCompleto = await this.encontrarPorId(usuarioGuardadoDb.id);
    return usuarioCompleto!;
  }

  public async actualizarPassword(
    usuarioId: string,
    nuevaPasswordPlano: string,
  ): Promise<void> {
    const saltRounds = 10;
    const nuevoPasswordHash = await bcrypt.hash(nuevaPasswordPlano, saltRounds);
    await this.prisma.user.update({
      where: { id: usuarioId },
      data: { password_hash: nuevoPasswordHash },
    });
  }

  public async actualizarPerfilAtleta(
    atletaId: string,
    datos: PerfilAtletaActualizable,
  ): Promise<void> {
    // 1. Actualizar los datos físicos del atleta
    await this.prisma.athlete.upsert({
      where: { userId: atletaId },
      update: {
        level: datos.nivel,
        height_cm: datos.alturaCm,
        weight_kg: datos.pesoKg,
        stance: datos.guardia,
        allergies: datos.alergias,
        emergency_contact_name: datos.contactoEmergenciaNombre,
        emergency_contact_phone: datos.contactoEmergenciaTelefono,
      },
      create: {
        userId: atletaId,
        level: datos.nivel,
        height_cm: datos.alturaCm,
        weight_kg: datos.pesoKg,
        stance: datos.guardia,
        allergies: datos.alergias,
        emergency_contact_name: datos.contactoEmergenciaNombre,
        emergency_contact_phone: datos.contactoEmergenciaTelefono,
      },
    });

    // 2. ✅ FIX: Actualizar el estado del usuario para que se marque como activo
    await this.prisma.user.update({
      where: { id: atletaId },
      data: {
        estado_atleta: 'activo',
        datos_fisicos_capturados: true,
        fecha_aprobacion: new Date(),
      },
    });

    console.log(`✅ ESTADO: Atleta ${atletaId} marcado como activo con datos físicos capturados`);
  }

  public async actualizarRefreshToken(
    usuarioId: string,
    refreshToken: string | null,
  ): Promise<void> {
    const refreshTokenHash = refreshToken
      ? await bcrypt.hash(refreshToken, 10)
      : null;
    await this.prisma.user.update({
      where: { id: usuarioId },
      data: { refresh_token_hash: refreshTokenHash },
    });
  }

  public async asociarAGimnasio(usuarioId: string, gymId: string): Promise<void> {
    await this.prisma.userGymRelation.create({
      data: {
        userId: usuarioId,
        gymId: gymId,
      },
    });
  }

  public async marcarComoVerificado(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        email_verificado: true,
        confirmation_token: null, // Limpiar el token una vez usado
        confirmation_token_expires_at: null,
      },
    });
  }

  public async establecerTokenDeConfirmacion(id: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        confirmation_token: token,
        confirmation_token_expires_at: expiresAt,
      },
    });
  }

  public async encontrarPorTokenDeConfirmacion(token: string): Promise<Usuario | null> {
    const usuarioDb = await this.prisma.user.findFirst({
      where: {
        confirmation_token: token,
        confirmation_token_expires_at: {
          gte: new Date(), // Asegurarse de que el token no haya expirado
        },
      },
      include: {
        athleteProfile: true,
        ownedGym: true,
        gyms: {
          include: {
            gym: true,
          },
        },
      },
    });

    return usuarioDb ? this.mapearADominio(usuarioDb) : null;
  }

  private mapearADominio(usuarioDb: UsuarioConPerfilCompleto): Usuario {
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

    let gimnasioDominio: GimnasioDominio | null = null;
    
    // ✅ CORRECCIÓN: Manejar tanto ownedGym como gyms
    if (usuarioDb.ownedGym) {
      // Si es dueño de un gimnasio (Admin)
      gimnasioDominio = {
        id: usuarioDb.ownedGym.id,
        nombre: usuarioDb.ownedGym.name,
      };
    } else if (usuarioDb.gyms && usuarioDb.gyms.length > 0) {
      // Si es miembro de un gimnasio (Entrenador/Atleta)
      gimnasioDominio = {
        id: usuarioDb.gyms[0].gym.id,
        nombre: usuarioDb.gyms[0].gym.name,
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
      gimnasio: gimnasioDominio,
      emailVerificado: usuarioDb.email_verificado,
      estadoAtleta: usuarioDb.estado_atleta,
      datosFisicosCapturados: usuarioDb.datos_fisicos_capturados,
    });
  }
}
