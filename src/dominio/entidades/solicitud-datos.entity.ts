import { randomUUID } from 'crypto';

type EstadoSolicitud = 'PENDIENTE' | 'COMPLETADA';

interface SolicitudDatosProps {
  id: string;
  atletaId: string;
  coachId: string;
  status: EstadoSolicitud;
  requestedAt: Date;
  // Propiedades opcionales que pueden venir de un JOIN en la base de datos
  nombreAtleta?: string;
  emailAtleta?: string;
}

export class SolicitudDatos {
  readonly id: string;
  readonly atletaId: string;
  readonly coachId: string;
  public status: EstadoSolicitud;
  readonly requestedAt: Date;
  public nombreAtleta?: string;
  public emailAtleta?: string;

  private constructor(props: SolicitudDatosProps) {
    this.id = props.id;
    this.atletaId = props.atletaId;
    this.coachId = props.coachId;
    this.status = props.status;
    this.requestedAt = props.requestedAt;
    this.nombreAtleta = props.nombreAtleta;
    this.emailAtleta = props.emailAtleta;
  }

  /**
   * Método de fábrica para crear una nueva solicitud.
   */
  public static crear(props: { atletaId: string; coachId: string }): SolicitudDatos {
    return new SolicitudDatos({
      id: randomUUID(),
      atletaId: props.atletaId,
      coachId: props.coachId,
      status: 'PENDIENTE',
      requestedAt: new Date(),
    });
  }

  /**
   * Método para reconstituir una entidad desde la persistencia.
   */
  public static desdePersistencia(props: SolicitudDatosProps): SolicitudDatos {
    return new SolicitudDatos(props);
  }

  public completar(): void {
    if (this.status === 'COMPLETADA') {
      throw new Error('La solicitud ya ha sido completada.');
    }
    this.status = 'COMPLETADA';
  }
}