import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export enum RolUsuario {
  Atleta = 'Atleta',
  Entrenador = 'Entrenador',
  Admin = 'Admin',
}

export class RegistrarUsuarioDto {
  @IsEmail({}, { message: 'El correo electrónico proporcionado no es válido.' })
  @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @IsNotEmpty({ message: 'La contraseña no puede estaría.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  nombre: string;

  @IsEnum(RolUsuario, { message: 'El rol proporcionado no es válido.' })
  @IsNotEmpty({ message: 'Debe especificar un rol.' })
  rol: RolUsuario;
}
