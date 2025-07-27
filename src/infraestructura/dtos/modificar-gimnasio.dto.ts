import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class ModificarGimnasioDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pequeño', 'mediano', 'grande'], { message: 'El tamaño debe ser: pequeño, mediano o grande.' })
  size?: string;

  @IsOptional()
  @IsNumber()
  totalBoxers?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
} 