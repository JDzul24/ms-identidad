import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { ISolicitudRepositorio } from '../../dominio/repositorios/solicitud.repositorio';
import { SolicitudDatos } from '../../dominio/entidades/solicitud-datos.entity';
import { PerfilUsuarioDto } from '../../infraestructura/dtos/perfil-usuario.dto';

@Injectable()
export class VincularGimnasioService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
    @Inject('ISolicitudRepositorio')
    private readonly solicitudRepositorio: ISolicitudRepositorio,
  ) {}

  /**
   * Ejecuta la lógica para vincular la cuenta de un usuario a un gimnasio.
   *
   * @param usuarioId El ID del usuario autenticado.
   * @param claveGym La clave del gimnasio proporcionada.
   * @returns El perfil de usuario completo y actualizado.
   */
  async ejecutar(
    usuarioId: string,
    claveGym: string,
  ): Promise<PerfilUsuarioDto> {
    // 1. Validar que la clave del gimnasio sea correcta
    const gimnasio = await this.gimnasioRepositorio.encontrarPorClave(claveGym);
    if (!gimnasio) {
      throw new NotFoundException('La clave del gimnasio proporcionada no es válida.');
    }

    // 2. Obtener los datos del usuario para verificar su estado actual
    const usuario = await this.usuarioRepositorio.encontrarPorId(usuarioId);
    if (!usuario) {
      // Este caso es muy improbable si el token es válido, pero es una guarda de seguridad.
      throw new NotFoundException('Usuario no encontrado.');
    }
    if (usuario.gimnasio) {
      throw new UnprocessableEntityException('Esta cuenta ya está vinculada a un gimnasio.');
    }

    // 3. Asociar al usuario con el gimnasio
    await this.usuarioRepositorio.asociarAGimnasio(usuario.id, gimnasio.id);

    // 4. Si el usuario es un Atleta, crear la solicitud de aprobación
    if (usuario.rol === 'Atleta') {
      const nuevaSolicitud = SolicitudDatos.crear({
        atletaId: usuario.id,
        coachId: gimnasio.ownerId, // La solicitud se asigna al dueño del gimnasio
      });
      await this.solicitudRepositorio.guardar(nuevaSolicitud);
    }

    // 5. Devolver el perfil actualizado y completo
    const usuarioActualizado = await this.usuarioRepositorio.encontrarPorId(usuario.id);
    // El '!' (non-null assertion) es seguro aquí porque sabemos que el usuario existe.
    return {
      id: usuarioActualizado!.id,
      email: usuarioActualizado!.email,
      nombre: usuarioActualizado!.nombre,
      rol: usuarioActualizado!.rol,
      gimnasio: usuarioActualizado!.gimnasio
        ? {
            id: usuarioActualizado!.gimnasio.id,
            nombre: usuarioActualizado!.gimnasio.nombre,
          }
        : null,
      perfilAtleta: usuarioActualizado!.perfilAtleta,
    };
  }
}
