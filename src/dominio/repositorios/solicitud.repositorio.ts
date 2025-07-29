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

  /**
   * Elimina una solicitud por su ID.
   * @param id - El ID de la solicitud a eliminar.
   */
  eliminar(id: string): Promise<void>;

  /**
   * Crea una nueva solicitud con los datos proporcionados.
   * @param datos - Los datos para crear la nueva solicitud.
   * @returns La solicitud creada.
   */
  crear(datos: {
    atletaId: string;
    coachId: string;
    status: 'PENDIENTE' | 'COMPLETADA';
    requestedAt: Date;
  }): Promise<SolicitudDatos>;
}
