/**
 * Data Transfer Object para representar una solicitud de captura de datos pendiente.
 * Esta es la estructura que recibirá el frontend.
 */
export class SolicitudPendienteDto {
  idSolicitud: string;
  idAtleta: string;
  nombreAtleta: string;
  emailAtleta: string;
  fechaSolicitud: Date;
}