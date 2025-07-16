import { Gimnasio } from '../entidades/gimnasio.entity';
import { Usuario } from '../entidades/usuario.entity';

export interface IGimnasioRepositorio {
  encontrarPorClave(claveGym: string): Promise<Gimnasio | null>;
  
  /**
   * Obtiene todos los usuarios (miembros) asociados a un gimnasio específico.
   * @param gymId El ID del gimnasio.
   * @returns Una promesa que resuelve a un arreglo de entidades Usuario.
   */
  obtenerMiembros(gymId: string): Promise<Usuario[]>;
}
