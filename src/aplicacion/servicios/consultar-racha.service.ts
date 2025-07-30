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
          this.logger.warn(`Error al obtener asistencia para fecha ${fecha}:`, error);
          // Añadir entrada con datos por defecto
          const fecha = new Date(hoy);
          fecha.setDate(fecha.getDate() - i);
          diasConsecutivos.push({
            fecha: fecha.toISOString().split('T')[0],
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
    if (!response.usuario_id) {
      throw new Error('usuario_id no puede ser null o vacío');
    }
    if (response.racha_actual === null || response.racha_actual === undefined) {
      throw new Error('racha_actual no puede ser null');
    }
    if (!response.estado) {
      throw new Error('estado no puede ser null o vacío');
    }
    if (!response.ultima_actualizacion) {
      throw new Error('ultima_actualizacion no puede ser null o vacío');
    }
    if (response.record_personal === null || response.record_personal === undefined) {
      throw new Error('record_personal no puede ser null');
    }
    if (!Array.isArray(response.dias_consecutivos)) {
      throw new Error('dias_consecutivos debe ser un array');
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
        fecha: fecha.toISOString().split('T')[0],
        status: null,
      });
    }

    return {
      usuario_id: usuarioId,
      racha_actual: 0,
      estado: 'activo' as const,
      ultima_actualizacion: new Date().toISOString(),
      record_personal: 0,
      dias_consecutivos: diasConsecutivos,
    };
  }
} 