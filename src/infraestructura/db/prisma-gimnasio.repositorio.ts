import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { User } from '@prisma/client';

import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { Gimnasio } from '../../dominio/entidades/gimnasio.entity';
import { Usuario, RolUsuario } from '../../dominio/entidades/usuario.entity';

@Injectable()
export class PrismaGimnasioRepositorio implements IGimnasioRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  public async encontrarPorClave(claveGym: string): Promise<Gimnasio | null> {
    const gymDb = await this.prisma.gym.findUnique({
      where: { gymKey: claveGym },
    });

    if (!gymDb) {
      return null;
    }
    // Suponiendo que la entidad Gimnasio tiene un método 'desdePersistencia'
    return Gimnasio.desdePersistencia(gymDb);
  }

  public async obtenerMiembros(gymId: string): Promise<Usuario[]> {
    const relaciones = await this.prisma.userGymRelation.findMany({
      where: { gymId: gymId },
      include: {
        user: true,
      },
    });

    // Mapeamos los resultados a nuestra entidad de dominio 'Usuario'
    return relaciones.map((relacion) =>
      this.mapearUsuarioADominio(relacion.user),
    );
  }

  /**
   * Mapea un objeto de usuario de la base de datos a una entidad de dominio.
   * @param usuarioDb - El objeto 'User' recuperado de Prisma.
   * @returns Una instancia de la entidad de dominio `Usuario`.
   */
  private mapearUsuarioADominio(usuarioDb: User): Usuario {
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
