import { IsDateString, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export enum StatusAsistencia {
  Presente = 'presente',
  Falto = 'falto',
  Permiso = 'permiso',
}

export class AsistenciaDto {
  @IsUUID('4', { message: 'El ID del alumno debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID del alumno es requerido.' })
  alumno_id: string;

  @IsEnum(StatusAsistencia, { message: 'El status debe ser: presente, falto o permiso.' })
  @IsNotEmpty({ message: 'El status es requerido.' })
  status: StatusAsistencia;
}

export class ActualizarAsistenciaDto {
  @IsEnum(StatusAsistencia, { message: 'El status debe ser: presente, falto o permiso.' })
  @IsNotEmpty({ message: 'El status es requerido.' })
  status: StatusAsistencia;
}

export class AsistenciaMasivaDto {
  @IsDateString({}, { message: 'La fecha debe ser una fecha válida en formato ISO.' })
  @IsNotEmpty({ message: 'La fecha es requerida.' })
  fecha: string;

  @IsNotEmpty({ message: 'La lista de asistencias es requerida.' })
  asistencias: AsistenciaDto[];
}

export class AlumnoAsistenciaDto {
  id: string;
  nombre: string;
  email: string;
  status: StatusAsistencia | null;
  racha_actual: number;
  ultima_asistencia: Date | null;
}

export class AsistenciaGymDto {
  fecha: string;
  gymnarium: {
    id: string;
    nombre: string;
  };
  alumnos: AlumnoAsistenciaDto[];
}

export class AsistenciaActualizadaDto {
  message: string;
  fecha: string;
  total_registrados: number;
  rachas_actualizadas: {
    alumno_id: string;
    racha_anterior: number;
    racha_actual: number;
    accion: string;
  }[];
} 