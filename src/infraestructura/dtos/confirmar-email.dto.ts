import { IsNotEmpty, IsString, Length } from 'class-validator';
 
export class ConfirmarEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'El token no puede estar vacío.' })
  @Length(6, 6, { message: 'El token debe tener exactamente 6 dígitos.' })
  token: string;
} 