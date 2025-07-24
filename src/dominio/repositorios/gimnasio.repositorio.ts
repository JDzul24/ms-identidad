import { Gimnasio } from '../entidades/gimnasio.entity';
import { Usuario } from '../entidades/usuario.entity';

/**
 * Interfaz que define las operaciones de persistencia para la entidad Gimnasio.
 */
export interface IGimnasioRepositorio {
  /**
   * Busca un gimnasio por su clave de registro única.
   */
  encontrarPorClave(claveGym: string): Promise<Gimnasio | null>;

  /**
   * Obtiene todos los usuarios (miembros) asociados a un gimnasio específico.
   */
  obtenerMiembros(gymId: string): Promise<Usuario[]>;

  /**
   * Busca el gimnasio al que pertenece un usuario (miembro).
   * @param miembroId El ID del usuario (atleta o entrenador).
   * @returns Una promesa que resuelve a la entidad Gimnasio si el usuario pertenece a uno, o null en caso contrario.
   */
  encontrarPorMiembroId(miembroId: string): Promise<Gimnasio | null>;
}
