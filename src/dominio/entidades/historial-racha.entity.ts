import { randomUUID } from 'crypto';

interface HistorialRachaProps {
  id: string;
  usuarioId: string;
  rachaId: string;
  inicio: Date;
  fin?: Date;
  duracion: number;
  motivoFin?: string;
  createdAt: Date;
}

export class HistorialRacha {
  readonly id: string;
  readonly usuarioId: string;
  readonly rachaId: string;
  readonly inicio: Date;
  public fin?: Date;
  readonly duracion: number;
  public motivoFin?: string;
  readonly createdAt: Date;

  private constructor(props: HistorialRachaProps) {
    this.id = props.id;
    this.usuarioId = props.usuarioId;
    this.rachaId = props.rachaId;
    this.inicio = props.inicio;
    this.fin = props.fin;
    this.duracion = props.duracion;
    this.motivoFin = props.motivoFin;
    this.createdAt = props.createdAt;
  }

  public static crear(props: {
    usuarioId: string;
    rachaId: string;
    inicio: Date;
    duracion: number;
  }): HistorialRacha {
    if (!props.usuarioId || !props.rachaId || !props.inicio || props.duracion < 0) {
      throw new Error('Todos los campos son requeridos para crear un historial de racha.');
    }

    return new HistorialRacha({
      id: randomUUID(),
      usuarioId: props.usuarioId,
      rachaId: props.rachaId,
      inicio: props.inicio,
      duracion: props.duracion,
      createdAt: new Date(),
    });
  }

  public static desdePersistencia(props: HistorialRachaProps): HistorialRacha {
    return new HistorialRacha(props);
  }

  public finalizarRacha(fin: Date, motivoFin: string): void {
    this.fin = fin;
    this.motivoFin = motivoFin;
  }
} 