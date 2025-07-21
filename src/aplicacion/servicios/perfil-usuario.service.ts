import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { PerfilUsuarioDto } from '../../infraestructura/dtos/perfil-usuario.dto';

@Injectable()
export class PerfilUsuarioService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
  ) {}

  /**
   * Obtiene y construye el perfil completo de un usuario por su ID.
   * @param usuarioId El ID del usuario extraído del token JWT.
   * @returns Un DTO con la información completa y estructurada del perfil.
   */
  async ejecutar(usuarioId: string): Promise<PerfilUsuarioDto> {
    const usuario = await this.usuarioRepositorio.encontrarPorId(usuarioId);

    if (!usuario) {
      throw new NotFoundException(
        'El usuario asociado a este token ya no existe.',
      );
    }

    // Ahora podemos acceder a las propiedades de forma segura y tipada
    const perfilDto: PerfilUsuarioDto = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,

      gimnasio: usuario.gimnasio
        ? {
            id: usuario.gimnasio.id,
            nombre: usuario.gimnasio.nombre,
          }
        : null,

      perfilAtleta: usuario.perfilAtleta
        ? {
            nivel: usuario.perfilAtleta.nivel,
            alturaCm: usuario.perfilAtleta.alturaCm,
            pesoKg: usuario.perfilAtleta.pesoKg,
            guardia: usuario.perfilAtleta.guardia,
            alergias: usuario.perfilAtleta.alergias,
            contactoEmergenciaNombre:
              usuario.perfilAtleta.contactoEmergenciaNombre,
            contactoEmergenciaTelefono:
              usuario.perfilAtleta.contactoEmergenciaTelefono,
          }
        : null,
    };

    return perfilDto;
  }
}