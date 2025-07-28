import { randomUUID } from 'crypto';

interface AsistenciaProps {
  id: string;
  gymId: string;
  alumnoId: string;
  fecha: Date;
  status: 'presente' | 'falto' | 'permiso';
  createdAt: Date;
  updatedAt: Date;
}

export class Asistencia {
  readonly id: string;
  readonly gymId: string;
  readonly alumnoId: string;
  readonly fecha: Date;
  readonly status: 'presente' | 'falto' | 'permiso';
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: AsistenciaProps) {
    this.id = props.id;
    this.gymId = props.gymId;
    this.alumnoId = props.alumnoId;
    this.fecha = props.fecha;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static crear(props: {
    gymId: string;
    alumnoId: string;
    fecha: Date;
    status: 'presente' | 'falto' | 'permiso';
  }): Asistencia {
    if (!props.gymId || !props.alumnoId || !props.fecha || !props.status) {
      throw new Error('Todos los campos son requeridos para crear una asistencia.');
    }

    if (!['presente', 'falto', 'permiso'].includes(props.status)) {
      throw new Error('El status debe ser: presente, falto o permiso.');
    }

    const fechaNormalizada = new Date(props.fecha);
    fechaNormalizada.setUTCHours(0, 0, 0, 0);

    return new Asistencia({
      id: randomUUID(),
      gymId: props.gymId,
      alumnoId: props.alumnoId,
      fecha: fechaNormalizada,
      status: props.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static desdePersistencia(props: AsistenciaProps): Asistencia {
    return new Asistencia(props);
  }

  public actualizarStatus(nuevoStatus: 'presente' | 'falto' | 'permiso'): Asistencia {
    return new Asistencia({
      ...this,
      status: nuevoStatus,
      updatedAt: new Date(),
    });
  }
} 