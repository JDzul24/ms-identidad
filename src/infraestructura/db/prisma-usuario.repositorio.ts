import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { PerfilAtletaActualizable } from '../../dominio/tipos/tipos-dominio';
import { Usuario, RolUsuario } from '../../dominio/entidades/usuario.entity';

@Injectable()
export class PrismaUsuarioRepositorio implements IUsuarioRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  public async encontrarPorEmail(email: string): Promise<Usuario | null> {
    const usuarioDb = await this.prisma.user.findUnique({
      where: { email },
    });

    return usuarioDb ? this.mapearADominio(usuarioDb) : null;
  }

  public async encontrarPorId(id: string): Promise<Usuario | null> {
    const usuarioDb = await this.prisma.user.findUnique({
      where: { id },
    });

    return usuarioDb ? this.mapearADominio(usuarioDb) : null;
  }

  public async guardar(usuario: Usuario): Promise<Usuario> {
    const usuarioGuardadoDb = await this.prisma.user.create({
      data: {
        id: usuario.id,
        email: usuario.email,
        password_hash: usuario.obtenerPasswordHash(),
        name: usuario.nombre,
        role: usuario.rol,
        refresh_token_hash: usuario.refreshTokenHash,
      },
    });
    return this.mapearADominio(usuarioGuardadoDb);
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
  }

  public async actualizarRefreshToken(
    usuarioId: string,
    refreshToken: string | null,
  ): Promise<void> {
    let refreshTokenHash: string | null = null;
    if (refreshToken) {
      const saltRounds = 10;
      refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);
    }
    await this.prisma.user.update({
      where: { id: usuarioId },
      data: { refresh_token_hash: refreshTokenHash },
    });
  }

  private mapearADominio(usuarioDb: User): Usuario {
    return Usuario.desdePersistencia({
      id: usuarioDb.id,
      email: usuarioDb.email,
      passwordHash: usuarioDb.password_hash ?? '',
      refreshTokenHash: usuarioDb.refresh_token_hash,
      nombre: usuarioDb.name,
      rol: usuarioDb.role as RolUsuario,
      createdAt: usuarioDb.createdAt,
    });
  }
}