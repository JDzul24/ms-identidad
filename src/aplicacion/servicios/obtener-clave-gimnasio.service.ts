import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { ClaveGimnasioDto } from '../../infraestructura/dtos/clave-gimnasio.dto';

@Injectable()
export class ObtenerClaveGimnasioService {
  constructor(
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
  ) {}

  /**
   * Ejecuta la lógica para obtener la clave de registro del gimnasio
   * al que pertenece el usuario solicitante.
   *
   * @param solicitanteId El ID del entrenador autenticado (del token JWT).
   * @returns Un DTO que contiene la clave del gimnasio.
   * @throws NotFoundException si el usuario no pertenece a ningún gimnasio.
   */
  async ejecutar(solicitanteId: string): Promise<ClaveGimnasioDto> {
    // 1. Utilizar el repositorio para encontrar el gimnasio asociado al ID del miembro.
    const gimnasio = await this.gimnasioRepositorio.encontrarPorMiembroId(
      solicitanteId,
    );

    // 2. Validar que se encontró un gimnasio.
    if (!gimnasio) {
      throw new NotFoundException(
        'El usuario solicitante no está asociado a ningún gimnasio.',
      );
    }

    // 3. Mapear la clave del gimnasio al DTO de respuesta.
    return {
      claveGym: gimnasio.gymKey,
    };
  }
}
