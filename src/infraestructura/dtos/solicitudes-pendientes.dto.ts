export class AtletaPendienteDto {
  id: string;
  name: string;
  email: string;
  role: string;
  estado_atleta: string;
  datos_fisicos_capturados: boolean;
  fecha_registro: Date;
  gimnasio: {
    id: string;
    nombre: string;
  } | null;
} 