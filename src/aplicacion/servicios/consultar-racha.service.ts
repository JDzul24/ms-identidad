import { Inject, Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { IRachaRepositorio } from '../../dominio/repositorios/racha.repositorio';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { IAsistenciaRepositorio } from '../../dominio/repositorios/asistencia.repositorio';
import { RachaDto } from '../../infraestructura/dtos/racha.dto';

@Injectable()
export class ConsultarRachaService {
  private readonly logger = new Logger(ConsultarRachaService.name);

  constructor(
    @Inject('IRachaRepositorio')
    private readonly rachaRepositorio: IRachaRepositorio,
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    @Inject('IAsistenciaRepositorio')
    private readonly asistenciaRepositorio: IAsistenciaRepositorio,
  ) {}

  async ejecutar(usuarioId: string, solicitanteId: string): Promise<RachaDto> {
    this.logger.log(`Consultando racha para usuario ${usuarioId}, solicitante ${solicitanteId}`);
    
    try {
      // 1. Verificar que el usuario existe
      const usuario = await this.usuarioRepositorio.encontrarPorId(usuarioId);
      if (!usuario) {
        this.logger.error(`Usuario con ID ${usuarioId} no encontrado`);
        throw new NotFoundException('Usuario no encontrado.');
      }

      // 2. Verificar permisos (el usuario puede ver su propia racha o ser admin/coach)
      if (solicitanteId !== usuarioId) {
        const solicitante = await this.usuarioRepositorio.encontrarPorId(solicitanteId);
        if (!solicitante || !['Admin', 'Entrenador'].includes(solicitante.rol)) {
          this.logger.warn(`Usuario ${solicitanteId} sin permisos para ver racha de ${usuarioId}`);
          throw new ForbiddenException('No tienes permisos para ver esta racha.');
        }
      }

      // 3. Obtener o crear racha
      const racha = await this.rachaRepositorio.crearOEncontrar(usuarioId);
      
      // Validar que la racha tiene valores válidos
      const rachaActual = racha.rachaActual !== null && racha.rachaActual !== undefined ? racha.rachaActual : 0;
      const estado = racha.estado && ['activo', 'congelado'].includes(racha.estado) ? racha.estado : 'activo';
      const recordPersonal = racha.recordPersonal !== null && racha.recordPersonal !== undefined ? racha.recordPersonal : 0;
      const ultimaActualizacion = racha.ultimaActualizacion || new Date();

      this.logger.debug(`Racha obtenida: actual=${rachaActual}, estado=${estado}, record=${recordPersonal}`);

      // 4. Obtener días consecutivos (últimos 7 días)
      const diasConsecutivos = [];
      const hoy = new Date();
      
      for (let i = 0; i < 7; i++) {
        try {
          const fecha = new Date(hoy);
          fecha.setDate(fecha.getDate() - i);
          
          const asistencia = await this.asistenciaRepositorio.encontrarPorAlumnoYFecha(
            usuarioId,
            fecha,
          );

          // Asegurar que status sea un valor válido o null
          let status: 'presente' | 'falto' | 'permiso' | null = null;
          if (asistencia && asistencia.status) {
            const validStatuses = ['presente', 'falto', 'permiso'];
            status = validStatuses.includes(asistencia.status) ? asistencia.status as any : null;
          }

          diasConsecutivos.push({
            fecha: fecha.toISOString().split('T')[0],
            status: status,
          });
        } catch (error) {
          // Calcular la fecha para el error log y datos por defecto
          const fechaError = new Date(hoy);
          fechaError.setDate(fechaError.getDate() - i);
          this.logger.warn(`Error al obtener asistencia para fecha ${fechaError.toISOString().split('T')[0]}:`, error);
          
          // Añadir entrada con datos por defecto
          diasConsecutivos.push({
            fecha: fechaError.toISOString().split('T')[0],
            status: null,
          });
        }
      }

      // Construir respuesta asegurando que no hay valores null
      const response: RachaDto = {
        usuario_id: usuarioId || "",
        racha_actual: rachaActual,
        estado: estado as 'activo' | 'congelado',
        ultima_actualizacion: ultimaActualizacion.toISOString(),
        record_personal: recordPersonal,
        dias_consecutivos: diasConsecutivos,
      };

      // Validación final para asegurar que no hay valores null/undefined
      this.validateResponse(response);

      this.logger.log(`Racha consultada exitosamente para usuario ${usuarioId}`);
      return response;
    } catch (error) {
      this.logger.error(`Error al consultar racha para usuario ${usuarioId}:`, error.message);
      
      // Si es una excepción conocida, re-lanzarla
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      // Para otros errores, devolver una racha por defecto para evitar null
      this.logger.warn(`Devolviendo racha por defecto para usuario ${usuarioId} debido a error`);
      return this.createDefaultRacha(usuarioId);
    }
  }

  private validateResponse(response: RachaDto): void {
    // Validar campos obligatorios string
    if (!response.usuario_id || response.usuario_id === null) {
      response.usuario_id = "";
      this.logger.warn('usuario_id era null, asignando string vacío');
    }
    
    if (!response.estado || response.estado === null) {
      response.estado = 'activo';
      this.logger.warn('estado era null, asignando "activo"');
    }
    
    if (!response.ultima_actualizacion || response.ultima_actualizacion === null) {
      response.ultima_actualizacion = new Date().toISOString();
      this.logger.warn('ultima_actualizacion era null, asignando fecha actual');
    }
    
    // Validar campos numéricos
    if (response.racha_actual === null || response.racha_actual === undefined) {
      response.racha_actual = 0;
      this.logger.warn('racha_actual era null, asignando 0');
    }
    
    if (response.record_personal === null || response.record_personal === undefined) {
      response.record_personal = 0;
      this.logger.warn('record_personal era null, asignando 0');
    }
    
    // Validar array de días consecutivos
    if (!Array.isArray(response.dias_consecutivos)) {
      response.dias_consecutivos = [];
      this.logger.warn('dias_consecutivos no era array, asignando array vacío');
    } else {
      // Validar cada elemento del array
      response.dias_consecutivos = response.dias_consecutivos.map((dia, index) => {
        if (!dia.fecha || dia.fecha === null) {
          const fechaDefault = new Date();
          fechaDefault.setDate(fechaDefault.getDate() - index);
          dia.fecha = fechaDefault.toISOString().split('T')[0];
          this.logger.warn(`dias_consecutivos[${index}].fecha era null, asignando fecha por defecto`);
        }
        // status puede ser null, eso está permitido
        return dia;
      });
    }
  }

  private createDefaultRacha(usuarioId: string): RachaDto {
    this.logger.log(`Creando racha por defecto para usuario ${usuarioId}`);
    
    const diasConsecutivos = [];
    const hoy = new Date();
    
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      diasConsecutivos.push({
        fecha: fecha.toISOString().split('T')[0], // Asegurar string válido
        status: null, // null es permitido para status
      });
    }

    const defaultRacha: RachaDto = {
      usuario_id: usuarioId || "", // Asegurar string no null
      racha_actual: 0,
      estado: 'activo' as const,
      ultima_actualizacion: new Date().toISOString(), // Asegurar string fecha válida
      record_personal: 0,
      dias_consecutivos: diasConsecutivos,
    };

    // Validar la respuesta por defecto antes de devolverla
    this.validateResponse(defaultRacha);
    
    return defaultRacha;
  }
} 