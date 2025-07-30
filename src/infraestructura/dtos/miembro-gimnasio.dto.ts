/**
 * DTO para representar la información básica de un miembro de un gimnasio en una lista.
 */
export class MiembroGimnasioDto {
  /**
   * El ID único del miembro.
   */
  id: string;

  /**
   * El nombre completo del miembro.
   */
  nombre: string;

  /**
   * El correo electrónico del miembro.
   */
  email: string;

  /**
   * El rol del miembro ('Atleta' o 'Entrenador').
   */
  rol: string;

  /**
   * El nivel del miembro, si es un atleta.
   * Es opcional, ya que los entrenadores no tienen nivel.
   */
  nivel?: string | null;

  /**
   * El estado del atleta (pendiente_datos, activo, inactivo).
   * Solo aplica para usuarios con rol 'Atleta'.
   */
  estado_atleta?: string;

  /**
   * Indica si los datos físicos del atleta han sido capturados.
   * Solo aplica para usuarios con rol 'Atleta'.
   */
  datos_fisicos_capturados?: boolean;
}
