import { Inject, Injectable } from '@nestjs/common';
import { ISolicitudRepositorio } from '../../dominio/repositorios/solicitud.repositorio';
import { SolicitudPendienteDto } from '../../infraestructura/dtos/solicitud-pendiente.dto';

@Injectable()
export class ConsultarSolicitudesService {
  constructor(
    @Inject('ISolicitudRepositorio')
    private readonly solicitudRepositorio: ISolicitudRepositorio,
  ) {}

  /**
   * Obtiene la lista de solicitudes pendientes para un entrenador.
   * @param coachId El ID del entrenador autenticado.
   * @returns Un arreglo de DTOs con la información de las solicitudes.
   */
  async ejecutar(coachId: string): Promise<SolicitudPendienteDto[]> {
    const solicitudes = await this.solicitudRepositorio.encontrarPendientesPorEntrenador(
      coachId,
    );

    // Mapeamos las entidades de dominio a DTOs de respuesta.
    return solicitudes.map((solicitud) => ({
      idSolicitud: solicitud.id,
      idAtleta: solicitud.atletaId,
      nombreAtleta: solicitud.nombreAtleta,
      emailAtleta: solicitud.emailAtleta,
      fechaSolicitud: solicitud.requestedAt,
    }));
  }
}