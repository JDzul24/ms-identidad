export class RachaDto {
  usuario_id: string;
  racha_actual: number;
  estado: 'activo' | 'congelado';
  ultima_actualizacion: Date;
  record_personal: number;
  dias_consecutivos: {
    fecha: string;
    status: 'presente' | 'falto' | 'permiso';
  }[];
}

export class HistorialRachaDto {
  usuario_id: string;
  record_personal: number;
  racha_actual: number;
  rachas_anteriores: {
    inicio: Date;
    fin: Date | null;
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