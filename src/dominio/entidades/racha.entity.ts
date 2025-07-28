import { randomUUID } from 'crypto';

interface RachaProps {
  id: string;
  usuarioId: string;
  rachaActual: number;
  estado: 'activo' | 'congelado';
  recordPersonal: number;
  ultimaActualizacion: Date;
  createdAt: Date;
}

export class Racha {
  readonly id: string;
  readonly usuarioId: string;
  public rachaActual: number;
  public estado: 'activo' | 'congelado';
  public recordPersonal: number;
  public ultimaActualizacion: Date;
  readonly createdAt: Date;

  private constructor(props: RachaProps) {
    this.id = props.id;
    this.usuarioId = props.usuarioId;
    this.rachaActual = props.rachaActual;
    this.estado = props.estado;
    this.recordPersonal = props.recordPersonal;
    this.ultimaActualizacion = props.ultimaActualizacion;
    this.createdAt = props.createdAt;
  }

  public static crear(props: {
    usuarioId: string;
  }): Racha {
    if (!props.usuarioId) {
      throw new Error('El usuarioId es requerido para crear una racha.');
    }

    return new Racha({
      id: randomUUID(),
      usuarioId: props.usuarioId,
      rachaActual: 0,
      estado: 'activo',
      recordPersonal: 0,
      ultimaActualizacion: new Date(),
      createdAt: new Date(),
    });
  }

  public static desdePersistencia(props: RachaProps): Racha {
    return new Racha(props);
  }

  public actualizarRacha(status: 'presente' | 'falto' | 'permiso'): {
    rachaAnterior: number;
    rachaActual: number;
    accion: string;
  } {
    const rachaAnterior = this.rachaActual;
    let accion = 'sin_cambios';

    if (status === 'presente') {
      if (this.estado === 'congelado') {
        // Descongelar y mantener racha
        this.estado = 'activo';
        accion = 'descongelada';
      } else {
        // Incrementar racha
        this.rachaActual += 1;
        accion = 'incrementada';
      }
    } else if (status === 'falto') {
      // Resetear racha
      this.rachaActual = 0;
      this.estado = 'activo';
      accion = 'reseteada';
    } else if (status === 'permiso') {
      if (this.estado === 'activo') {
        // Congelar racha
        this.estado = 'congelado';
        accion = 'congelada';
      } else {
        // Ya está congelado, no cambiar
        accion = 'sin_cambios';
      }
    }

    // Actualizar record personal si es necesario
    if (this.rachaActual > this.recordPersonal) {
      this.recordPersonal = this.rachaActual;
    }

    this.ultimaActualizacion = new Date();

    return {
      rachaAnterior,
      rachaActual: this.rachaActual,
      accion,
    };
  }
} 