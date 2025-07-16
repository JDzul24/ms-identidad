import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class TokenRequestDto {
  @IsString()
  @IsNotEmpty()
  grant_type: string; // Debe ser 'password'

  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsString()
  @IsNotEmpty()
  client_secret: string;
  
  @IsEmail()
  @IsNotEmpty()
  username: string; // Mapeado a nuestro email

  @IsString()
  @IsNotEmpty()
  password: string;
}
