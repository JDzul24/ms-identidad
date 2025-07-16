import { Usuario } from '../entidades/usuario.entity';
import { PerfilAtletaActualizable } from '../tipos/tipos-dominio';

/**
 * Interfaz que define las operaciones de persistencia para la entidad Usuario.
 * Sirve como un contrato para la capa de infraestructura.
 */
export interface IUsuarioRepositorio {
  encontrarPorEmail(email: string): Promise<Usuario | null>;
  encontrarPorId(id: string): Promise<Usuario | null>;
  guardar(usuario: Usuario): Promise<Usuario>;
  actualizarPassword(
    usuarioId: string,
    nuevaPasswordPlano: string,
  ): Promise<void>;

  /**
   * Actualiza los datos específicos del perfil de un atleta.
   * @param atletaId - El ID del usuario atleta a actualizar.
   * @param datos - Un objeto con los campos del perfil a modificar.
   */
  actualizarPerfilAtleta(
    atletaId: string,
    datos: PerfilAtletaActualizable,
  ): Promise<void>;

  /**
   * Actualiza o elimina el hash del refresh token para un usuario.
   * @param usuarioId El ID del usuario.
   * @param refreshToken El nuevo refresh token (se hasheará) o null para invalidarlo.
   */
  actualizarRefreshToken(
    usuarioId: string,
    refreshToken: string | null,
  ): Promise<void>;
}
