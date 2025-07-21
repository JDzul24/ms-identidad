/**
 * Objeto anidado que contiene la información del gimnasio.
 */
class GimnasioInfoDto {
  id: string;
  nombre: string;
}

/**
 * Objeto anidado que contiene los datos específicos del perfil de un atleta.
 * Será nulo si el usuario no tiene el rol de 'Atleta'.
 */
class PerfilAtletaDto {
  nivel: string | null;
  alturaCm: number | null;
  pesoKg: number | null;
  guardia: string | null;
  alergias: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
}

/**
 * DTO para representar el perfil completo de un usuario.
 * Esta es la estructura que se devolverá en la respuesta del endpoint GET /users/me.
 */
export class PerfilUsuarioDto {
  /**
   * El ID único del usuario.
   */
  id: string;

  /**
   * El correo electrónico del usuario.
   */
  email: string;

  /**
   * El nombre completo del usuario.
   */
  nombre: string;

  /**
   * El rol principal del usuario en la aplicación (Atleta, Entrenador, Admin).
   */
  rol: string;

  /**
   * Información del gimnasio al que pertenece el usuario.
   * Puede ser nulo si el usuario aún no está asociado a ninguno.
   */
  gimnasio: GimnasioInfoDto | null;

  /**
   * Datos adicionales del perfil si el usuario es un atleta.
   * Si el rol es 'Entrenador' o 'Admin', esta propiedad será nula.
   */
  perfilAtleta: PerfilAtletaDto | null;
}
