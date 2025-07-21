/**
 * Representa el evento de dominio que se dispara cuando
 * la solicitud de un atleta es aprobada por un entrenador.
 */
export class AtletaAprobadoEvento {
  public readonly fecha: Date;

  /**
   * @param atletaId El ID del atleta que ha sido aprobado.
   */
  constructor(public readonly atletaId: string) {
    this.fecha = new Date();
  }
}
