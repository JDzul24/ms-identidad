import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * Data Transfer Object para la aprobación de un atleta.
 * Contiene los datos físicos iniciales que el entrenador captura.
 */
export class AprobarAtletaDto {
  @IsString({ message: 'El nivel debe ser un texto.' })
  @IsNotEmpty({ message: 'El nivel del atleta es requerido.' })
  nivel: string; // e.g., 'Principiante', 'Intermedio'

  @IsNumber({}, { message: 'La altura debe ser un número.' })
  @Min(0, { message: 'La altura no puede ser negativa.' })
  @IsNotEmpty({ message: 'La altura es requerida.' })
  alturaCm: number;

  @IsNumber({}, { message: 'El peso debe ser un número.' })
  @Min(0, { message: 'El peso no puede ser negativo.' })
  @IsNotEmpty({ message: 'El peso es requerido.' })
  pesoKg: number;

  @IsString({ message: 'La guardia debe ser un texto.' })
  @IsOptional()
  guardia?: string; // e.g., 'Ortodoxo', 'Zurdo'

  @IsString({ message: 'Las alergias deben ser un texto.' })
  @IsOptional()
  alergias?: string;

  @IsString({ message: 'El nombre del contacto de emergencia debe ser un texto.' })
  @IsOptional()
  contactoEmergenciaNombre?: string;
  
  @IsString({ message: 'El teléfono del contacto de emergencia debe ser un texto.' })
  @IsOptional()
  contactoEmergenciaTelefono?: string;
}
