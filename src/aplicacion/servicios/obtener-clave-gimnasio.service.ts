import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { ClaveGimnasioDto } from '../../infraestructura/dtos/clave-gimnasio.dto';
import { Gimnasio } from '../../dominio/entidades/gimnasio.entity';

@Injectable()
export class ObtenerClaveGimnasioService {
  constructor(
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
  ) {}

  /**
   * Ejecuta la lógica para obtener la clave de registro del gimnasio
   * al que pertenece el usuario solicitante, diferenciando por rol.
   *
   * @param solicitanteId El ID del usuario autenticado (del token JWT).
   * @param rol El rol del usuario autenticado.
   * @returns Un DTO que contiene la clave del gimnasio.
   * @throws NotFoundException si el usuario no está asociado a ningún gimnasio.
   */
  async ejecutar(
    solicitanteId: string,
    rol: string,
  ): Promise<ClaveGimnasioDto> {
    let gimnasio: Gimnasio | null;

    // Lógica condicional para determinar cómo buscar el gimnasio.
    if (rol === 'Admin') {
      // Un Admin es el dueño del gimnasio.
      gimnasio = await this.gimnasioRepositorio.encontrarPorOwnerId(
        solicitanteId,
      );
    } else {
      // Un Entrenador es un miembro del gimnasio.
      gimnasio = await this.gimnasioRepositorio.encontrarPorMiembroId(
        solicitanteId,
      );
    }

    // Validar que se encontró un gimnasio para el usuario.
    if (!gimnasio) {
      throw new NotFoundException(
        'No se encontró un gimnasio asociado a este usuario.',
      );
    }

    // Mapear la clave del gimnasio encontrado al DTO de respuesta.
    return {
      claveGym: gimnasio.gymKey,
    };
  }
}
