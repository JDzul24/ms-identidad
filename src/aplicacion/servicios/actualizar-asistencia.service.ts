import { Inject, Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { IAsistenciaRepositorio } from '../../dominio/repositorios/asistencia.repositorio';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { IRachaRepositorio } from '../../dominio/repositorios/racha.repositorio';
import { AsistenciaMasivaDto, AsistenciaActualizadaDto } from '../../infraestructura/dtos/asistencia.dto';
import { Asistencia } from '../../dominio/entidades/asistencia.entity';

@Injectable()
export class ActualizarAsistenciaService {
  private readonly logger = new Logger(ActualizarAsistenciaService.name);

  constructor(
    @Inject('IAsistenciaRepositorio')
    private readonly asistenciaRepositorio: IAsistenciaRepositorio,
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    @Inject('IRachaRepositorio')
    private readonly rachaRepositorio: IRachaRepositorio,
  ) {}

  async ejecutar(
    gymId: string,
    fecha: string,
    dto: AsistenciaMasivaDto,
    solicitanteId: string,
  ): Promise<AsistenciaActualizadaDto> {
    try {
      this.logger.log(`Iniciando actualización de asistencia para gimnasio ${gymId}, fecha ${fecha}, solicitante ${solicitanteId}`);
      
      // 1. Verificar que el gimnasio existe
      const gimnasio = await this.gimnasioRepositorio.encontrarPorId(gymId);
      if (!gimnasio) {
        this.logger.error(`Gimnasio con ID ${gymId} no encontrado`);
        throw new NotFoundException(`Gimnasio con ID ${gymId} no encontrado.`);
      }

      // 2. Verificar que el solicitante pertenece al gimnasio
      const solicitante = await this.usuarioRepositorio.encontrarPorId(solicitanteId);
      if (!solicitante) {
        this.logger.error(`Usuario con ID ${solicitanteId} no encontrado`);
        throw new NotFoundException(`Usuario con ID ${solicitanteId} no encontrado.`);
      }
      
      if (!solicitante.gimnasio) {
        this.logger.error(`El usuario ${solicitanteId} no pertenece a ningún gimnasio`);
        throw new ForbiddenException('No tienes un gimnasio asignado.');
      }
      
      if (solicitante.gimnasio.id !== gymId) {
        this.logger.warn(`El usuario ${solicitanteId} pertenece al gimnasio ${solicitante.gimnasio.id}, pero intenta acceder al ${gymId}`);
        throw new ForbiddenException(`No tienes permisos para este gimnasio (${gymId}). Tu gimnasio es: ${solicitante.gimnasio.id}`);
      }

      // 3. Normalizar la fecha
      let fechaObj: Date;
      try {
        fechaObj = new Date(fecha);
        // Validar que la fecha es válida
        if (isNaN(fechaObj.getTime())) {
          throw new Error('Formato de fecha inválido');
        }
        
        // Normalizar a UTC 00:00:00
        fechaObj.setUTCHours(0, 0, 0, 0);
        this.logger.log(`Fecha normalizada: ${fechaObj.toISOString()}`);
      } catch (error) {
        this.logger.error(`Error al procesar la fecha: ${fecha}`, error);
        throw new ForbiddenException(`La fecha proporcionada no es válida: ${fecha}. Formato esperado: YYYY-MM-DD`);
      }
      
      const rachasActualizadas = [];

      // 4. Procesar cada asistencia
      for (const asistenciaDto of dto.asistencias) {
        try {
          // Verificar que el alumno existe y pertenece al gimnasio
          const alumno = await this.usuarioRepositorio.encontrarPorId(asistenciaDto.alumno_id);
          if (!alumno) {
            this.logger.warn(`Alumno con ID ${asistenciaDto.alumno_id} no encontrado, omitiendo`);
            continue;
          }
          
          if (!alumno.gimnasio) {
            this.logger.warn(`Alumno ${asistenciaDto.alumno_id} sin gimnasio asignado, omitiendo`);
            continue;
          }
          
          if (alumno.gimnasio.id !== gymId) {
            this.logger.warn(`Alumno ${asistenciaDto.alumno_id} pertenece a otro gimnasio (${alumno.gimnasio.id}), omitiendo`);
            continue;
          }

          // Crear o actualizar asistencia
          const asistencia = Asistencia.crear({
            gymId,
            alumnoId: asistenciaDto.alumno_id,
            fecha: fechaObj,
            status: asistenciaDto.status,
          });

          await this.asistenciaRepositorio.guardar(asistencia);
          this.logger.log(`Asistencia guardada para alumno ${asistenciaDto.alumno_id} con estado ${asistenciaDto.status}`);

          // Actualizar racha del alumno
          const racha = await this.rachaRepositorio.crearOEncontrar(asistenciaDto.alumno_id);
          const resultadoRacha = racha.actualizarRacha(asistenciaDto.status);
          await this.rachaRepositorio.actualizar(racha);
          this.logger.log(`Racha actualizada para alumno ${asistenciaDto.alumno_id}: ${resultadoRacha.rachaAnterior} -> ${resultadoRacha.rachaActual} (${resultadoRacha.accion})`);

          rachasActualizadas.push({
            alumno_id: asistenciaDto.alumno_id || "",
            racha_anterior: resultadoRacha.rachaAnterior || 0,
            racha_actual: resultadoRacha.rachaActual || 0,
            accion: resultadoRacha.accion || "error",
          });
        } catch (error) {
          this.logger.error(`Error procesando asistencia para alumno ${asistenciaDto.alumno_id}:`, error);
          // Añadir información de error para que el frontend no reciba valores null
          rachasActualizadas.push({
            alumno_id: asistenciaDto.alumno_id || "",
            racha_anterior: 0,
            racha_actual: 0,
            accion: "error",
          });
        }
      }

      this.logger.log(`Asistencia actualizada exitosamente: ${rachasActualizadas.length} alumnos procesados`);
      return {
        message: 'Asistencia actualizada exitosamente',
        fecha,
        total_registrados: rachasActualizadas.length,
        rachas_actualizadas: rachasActualizadas,
      };
    } catch (error) {
      // Loguear el error completo
      this.logger.error(`Error al actualizar asistencia: ${error.message}`, error.stack);
      
      // Re-lanzar excepciones conocidas de NestJS
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      // Para otros errores, lanzar un error genérico 500
      throw new InternalServerErrorException(`Error al actualizar la asistencia: ${error.message}`);
    }
  }
} 