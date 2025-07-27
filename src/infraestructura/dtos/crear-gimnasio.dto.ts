import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CrearGimnasioDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del gimnasio es obligatorio.' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'El tamaño del gimnasio es obligatorio.' })
  @IsIn(['pequeño', 'mediano', 'grande'], { message: 'El tamaño debe ser: pequeño, mediano o grande.' })
  size: string;

  @IsNumber()
  @IsNotEmpty({ message: 'El total de boxeadores es obligatorio.' })
  totalBoxers: number;

  @IsString()
  @IsNotEmpty({ message: 'La ubicación es obligatoria.' })
  location: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
} 