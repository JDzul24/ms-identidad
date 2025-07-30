export class RachaDto {
  usuario_id: string;
  racha_actual: number;
  estado: 'activo' | 'congelado';
  ultima_actualizacion: string; // Cambiado a string para devolver fecha ISO
  record_personal: number;
  dias_consecutivos: {
    fecha: string;
    status: 'presente' | 'falto' | 'permiso' | null; // Permite null cuando no hay asistencia
  }[];
}

export class HistorialRachaDto {
  usuario_id: string;
  record_personal: number;
  racha_actual: number;
  rachas_anteriores: {
    inicio: string; // Cambiado a string para fecha ISO
    fin: string | null; // Fecha ISO o null si la racha sigue activa
    duracion: number;
    motivo_fin: string | null;
  }[];
}

export class RachaActualizadaDto {
  alumno_id: string;
  racha_anterior: number;
  racha_actual: number;
  accion: string;
} 