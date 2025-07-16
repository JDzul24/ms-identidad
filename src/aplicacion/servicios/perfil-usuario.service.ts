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
   * Obtiene la información del perfil de un usuario por su ID.
   * @param usuarioId El ID del usuario extraído del token JWT.
   * @returns Un DTO con la información pública del perfil.
   */
  async ejecutar(usuarioId: string): Promise<PerfilUsuarioDto> {
    const usuario = await this.usuarioRepositorio.encontrarPorId(usuarioId);

    if (!usuario) {
      throw new NotFoundException('El usuario asociado a este token ya no existe.');
    }

    // Mapeamos la entidad de dominio a un DTO de respuesta.
    // Esto asegura que nunca filtremos datos sensibles como el hash de la contraseña.
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };
  }
}