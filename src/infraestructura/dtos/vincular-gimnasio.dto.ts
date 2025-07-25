import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para el cuerpo de la petición de vinculación de una cuenta de usuario a un gimnasio.
 */
export class VincularGimnasioDto {
  /**
   * La clave de registro única del gimnasio al que el usuario desea vincularse.
   * @example "GYM-CAMPEONES-2025"
   */
  @IsString({ message: 'La clave del gimnasio debe ser un texto.' })
  @IsNotEmpty({ message: 'La clave del gimnasio no puede estar vacía.' })
  claveGym: string;
}
