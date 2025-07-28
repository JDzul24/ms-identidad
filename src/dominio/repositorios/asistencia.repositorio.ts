import { Asistencia } from '../entidades/asistencia.entity';

export interface IAsistenciaRepositorio {
  guardar(asistencia: Asistencia): Promise<Asistencia>;
  guardarMultiples(asistencias: Asistencia[]): Promise<void>;
  actualizar(asistencia: Asistencia): Promise<Asistencia>;
  encontrarPorGymYFecha(gymId: string, fecha: Date): Promise<Asistencia[]>;
  encontrarPorAlumnoYFecha(alumnoId: string, fecha: Date): Promise<Asistencia | null>;
  encontrarPorGymAlumnoYFecha(gymId: string, alumnoId: string, fecha: Date): Promise<Asistencia | null>;
  eliminarPorGymAlumnoYFecha(gymId: string, alumnoId: string, fecha: Date): Promise<void>;
} 