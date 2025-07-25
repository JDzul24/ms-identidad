import { Gimnasio } from '../entidades/gimnasio.entity';
import { Usuario } from '../entidades/usuario.entity';

/**
 * Interfaz que define las operaciones de persistencia para la entidad Gimnasio.
 */
export interface IGimnasioRepositorio {
  encontrarPorClave(claveGym: string): Promise<Gimnasio | null>;
  obtenerMiembros(gymId: string): Promise<Usuario[]>;
  encontrarPorMiembroId(miembroId: string): Promise<Gimnasio | null>;

  /**
   * Actualiza la clave de registro de un gimnasio.
   * @param ownerId - El ID del usuario propietario del gimnasio (Admin).
   * @param nuevaClave - La nueva clave de registro para el gimnasio.
   * @returns Una promesa que resuelve a la entidad Gimnasio actualizada.
   * @throws Error si el usuario no es dueño de ningún gimnasio.
   */
  actualizarClave(ownerId: string, nuevaClave: string): Promise<Gimnasio>;
}

