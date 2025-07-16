import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para el cuerpo de la petición de refresco de token.
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'El refresh_token no puede estar vacío.' })
  refresh_token: string;
}