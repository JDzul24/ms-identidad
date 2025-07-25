import {
  Inject,
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { ClaveGimnasioDto } from '../../infraestructura/dtos/clave-gimnasio.dto';

@Injectable()
export class ModificarClaveGimnasioService {
  constructor(
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
  ) {}

  /**
   * Ejecuta la lógica para que un administrador modifique la clave de registro de su gimnasio.
   *
   * @param solicitanteId El ID del administrador autenticado (del token JWT).
   * @param nuevaClave La nueva clave de registro para el gimnasio.
   * @returns Un DTO que contiene la nueva clave del gimnasio confirmada.
   * @throws NotFoundException si el administrador no es propietario de ningún gimnasio.
   */
  async ejecutar(
    solicitanteId: string,
    nuevaClave: string,
  ): Promise<ClaveGimnasioDto> {
    try {
      // 1. Delegar la operación de actualización al repositorio.
      // El repositorio se encargará de encontrar el gimnasio por el ownerId y actualizar su clave.
      const gimnasioActualizado = await this.gimnasioRepositorio.actualizarClave(
        solicitanteId,
        nuevaClave,
      );

      // 2. Mapear la clave actualizada al DTO de respuesta.
      return {
        claveGym: gimnasioActualizado.gymKey,
      };
    } catch (error) {
      // Si el repositorio lanza un error (ej. no encuentra el gimnasio),
      // lo capturamos y lo re-lanzamos como una excepción HTTP apropiada.
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      // Para cualquier otro error inesperado, lanzamos un error de servidor genérico.
      throw new HttpException(
        'Ocurrió un error inesperado al modificar la clave del gimnasio.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
