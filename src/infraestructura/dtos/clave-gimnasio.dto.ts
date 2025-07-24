/**
 * DTO para la respuesta del endpoint que obtiene la clave de registro de un gimnasio.
 */
export class ClaveGimnasioDto {
  /**
   * La clave de registro única del gimnasio.
   * @example "GYM-CAMPEONES-2025"
   */
  claveGym: string;
}
