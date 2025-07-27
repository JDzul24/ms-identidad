import { Usuario } from '../entidades/usuario.entity';
import { PerfilAtletaActualizable } from '../tipos/tipos-dominio';

/**
 * Interfaz que define las operaciones de persistencia para la entidad Usuario.
 * Sirve como un contrato para la capa de infraestructura.
 */
export interface IUsuarioRepositorio {
  /**
   * Busca un usuario por su dirección de correo electrónico única.
   */
  encontrarPorEmail(email: string): Promise<Usuario | null>;

  /**
   * Busca un usuario por su identificador único.
   */
  encontrarPorId(id: string): Promise<Usuario | null>;

  /**
   * Persiste una nueva entidad `Usuario` en la base de datos.
   */
  guardar(usuario: Usuario): Promise<Usuario>;

  /**
   * Actualiza la contraseña hasheada de un usuario existente.
   */
  actualizarPassword(
    usuarioId: string,
    nuevaPasswordPlano: string,
  ): Promise<void>;

  /**
   * Actualiza los datos específicos del perfil de un atleta.
   */
  actualizarPerfilAtleta(
    atletaId: string,
    datos: PerfilAtletaActualizable,
  ): Promise<void>;

  /**
   * Actualiza o elimina el hash del refresh token para un usuario.
   */
  actualizarRefreshToken(
    usuarioId: string,
    refreshToken: string | null,
  ): Promise<void>;

  /**
   * Crea una relación entre un usuario y un gimnasio en la tabla de unión.
   * @param usuarioId El ID del usuario a asociar.
   * @param gymId El ID del gimnasio al que se asociará.
   */
  asociarAGimnasio(usuarioId: string, gymId: string): Promise<void>;

  marcarComoVerificado(id: string): Promise<void>;
}
