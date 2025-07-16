import { SolicitudDatos } from '../entidades/solicitud-datos.entity';

/**
 * Interfaz que define las operaciones de persistencia para la entidad SolicitudDatos.
 */
export interface ISolicitudRepositorio {
  /**
   * Guarda una nueva solicitud de captura de datos.
   */
  guardar(solicitud: SolicitudDatos): Promise<void>;

  /**
   * Busca todas las solicitudes pendientes asociadas a un entrenador.
   */
  encontrarPendientesPorEntrenador(coachId: string): Promise<SolicitudDatos[]>;

  /**
   * Busca una solicitud específica por el ID del atleta involucrado.
   * @param atletaId - El ID del atleta cuya solicitud se busca.
   * @returns Una promesa que resuelve a la entidad SolicitudDatos o null si no existe.
   */
  encontrarPorIdAtleta(atletaId: string): Promise<SolicitudDatos | null>;

  /**
   * Actualiza el estado de una solicitud existente en la base de datos.
   * @param solicitud - La entidad SolicitudDatos con el estado modificado.
   */
  actualizar(solicitud: SolicitudDatos): Promise<void>;
}
