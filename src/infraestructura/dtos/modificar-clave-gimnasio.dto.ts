import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO para el cuerpo de la petición de modificación de la clave de un gimnasio.
 */
export class ModificarClaveGimnasioDto {
  /**
   * La nueva clave de registro para el gimnasio.
   * @example "GYM-NUEVO-CODIGO-2025"
   */
  @IsString({ message: 'La nueva clave debe ser un texto.' })
  @IsNotEmpty({ message: 'La nueva clave no puede estar vacía.' })
  @MinLength(8, { message: 'La nueva clave debe tener al menos 8 caracteres.' })
  nuevaClave: string;
}
