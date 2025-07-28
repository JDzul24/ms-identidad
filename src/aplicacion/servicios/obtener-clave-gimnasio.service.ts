import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { ClaveGimnasioDto } from '../../infraestructura/dtos/clave-gimnasio.dto';
import { Gimnasio } from '../../dominio/entidades/gimnasio.entity';
import { Usuario } from '../../dominio/entidades/usuario.entity';

@Injectable()
export class ObtenerClaveGimnasioService {
  constructor(
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
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

      // Si el Admin no tiene gimnasio, crear uno automáticamente
      if (!gimnasio) {
        const usuario = await this.usuarioRepositorio.encontrarPorId(solicitanteId);
        if (!usuario) {
          throw new NotFoundException('Usuario no encontrado.');
        }

        // Crear gimnasio automáticamente para el Admin
        gimnasio = Gimnasio.crear({
          ownerId: solicitanteId,
          nombre: `Gimnasio de ${usuario.nombre}`,
          tamaño: 'mediano',
          totalBoxeadores: 0,
          ubicacion: 'Por definir',
          imagenUrl: null,
          gymKey: `GYM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        });

        gimnasio = await this.gimnasioRepositorio.guardar(gimnasio);
        
        // ✅ CORRECCIÓN: Recargar el usuario para obtener el gimnasio recién creado
        const usuarioActualizado = await this.usuarioRepositorio.encontrarPorId(solicitanteId);
        if (usuarioActualizado && usuarioActualizado.gimnasio) {
          console.log('✅ CLAVE: Gimnasio creado automáticamente para admin:', usuario.email);
        }
      }
    } else {
      // Un Entrenador es un miembro del gimnasio.
      gimnasio = await this.gimnasioRepositorio.encontrarPorMiembroId(
        solicitanteId,
      );

      // Si el Entrenador no tiene gimnasio, no podemos crear uno automáticamente
    if (!gimnasio) {
      throw new NotFoundException(
          'No se encontró un gimnasio asociado a este usuario. Los entrenadores deben ser invitados por un administrador.',
      );
      }
    }

    // Mapear la clave del gimnasio encontrado al DTO de respuesta.
    return {
      claveGym: gimnasio.gymKey,
    };
  }
}
