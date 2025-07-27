import { IsJWT, IsNotEmpty } from 'class-validator';

export class ConfirmarEmailDto {
  @IsJWT({ message: 'El token proporcionado no es un JWT válido.' })
  @IsNotEmpty({ message: 'El token no puede estar vacío.' })
  token: string;
} 