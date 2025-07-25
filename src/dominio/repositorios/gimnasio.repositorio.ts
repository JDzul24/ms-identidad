import { Gimnasio } from '../entidades/gimnasio.entity';
import { Usuario } from '../entidades/usuario.entity';

/**
 * Interfaz que define las operaciones de persistencia para la entidad Gimnasio.
 */
export interface IGimnasioRepositorio {
  /**
   * Busca un gimnasio por su clave de registro única.
   * @param claveGym - La clave única del gimnasio.
   * @returns Una promesa que resuelve a la entidad Gimnasio o null si no se encuentra.
   */
  encontrarPorClave(claveGym: string): Promise<Gimnasio | null>;

  /**
   * Obtiene todos los usuarios (miembros) asociados a un gimnasio específico.
   * @param gymId - El ID del gimnasio.
   * @returns Una promesa que resuelve a un arreglo de entidades Usuario.
   */
  obtenerMiembros(gymId: string): Promise<Usuario[]>;

  /**
   * Busca el gimnasio al que pertenece un usuario (miembro).
   * @param miembroId - El ID del usuario (atleta o entrenador).
   * @returns Una promesa que resuelve a la entidad Gimnasio si el usuario pertenece a uno, o null en caso contrario.
   */
  encontrarPorMiembroId(miembroId: string): Promise<Gimnasio | null>;

  /**
   * Actualiza la clave de registro de un gimnasio.
   * @param ownerId - El ID del usuario propietario del gimnasio (Admin).
   * @param nuevaClave - La nueva clave de registro para el gimnasio.
   * @returns Una promesa que resuelve a la entidad Gimnasio actualizada.
   */
  actualizarClave(ownerId: string, nuevaClave: string): Promise<Gimnasio>;

  /**
   * Busca un gimnasio por el ID de su propietario (Admin).
   * @param ownerId - El ID del usuario propietario.
   * @returns Una promesa que resuelve a la entidad Gimnasio si se encuentra, o null en caso contrario.
   */
  encontrarPorOwnerId(ownerId: string): Promise<Gimnasio | null>;
}
