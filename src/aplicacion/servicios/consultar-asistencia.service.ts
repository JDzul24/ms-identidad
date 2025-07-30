import { Inject, Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { IAsistenciaRepositorio } from '../../dominio/repositorios/asistencia.repositorio';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { IRachaRepositorio } from '../../dominio/repositorios/racha.repositorio';
import { AsistenciaGymDto, AlumnoAsistenciaDto, StatusAsistencia } from '../../infraestructura/dtos/asistencia.dto';

@Injectable()
export class ConsultarAsistenciaService {
  private readonly logger = new Logger(ConsultarAsistenciaService.name);

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

  async ejecutar(gymId: string, fecha: string, solicitanteId: string): Promise<AsistenciaGymDto> {
    this.logger.log(`Consultando asistencia para gimnasio ${gymId}, fecha ${fecha}, solicitante ${solicitanteId}`);
    
    try {
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

      // 3. Obtener todos los miembros del gimnasio
      const miembros = await this.gimnasioRepositorio.obtenerMiembros(gymId);
      
      // Normalizar la fecha
      let fechaObj: Date;
      try {
        fechaObj = new Date(fecha);
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

      // 4. Para cada miembro, obtener su asistencia y racha
      this.logger.log(`Procesando ${miembros.length} miembros del gimnasio`);
      const alumnos: AlumnoAsistenciaDto[] = await Promise.all(
        miembros
          .filter((miembro) => miembro.rol === 'Atleta')
          .map(async (miembro) => {
            this.logger.debug(`Procesando alumno ${miembro.id} (${miembro.nombre})`);
            
            try {
              // Obtener asistencia para la fecha
              const asistencia = await this.asistenciaRepositorio.encontrarPorGymAlumnoYFecha(
                gymId,
                miembro.id,
                fechaObj,
              );

              // Obtener racha del alumno - siempre obtener la más reciente de la base de datos
              const racha = await this.rachaRepositorio.encontrarPorUsuarioId(miembro.id) || 
                           await this.rachaRepositorio.crearOEncontrar(miembro.id);
              
              this.logger.debug(`Alumno ${miembro.id}: status=${asistencia?.status || 'sin registro'}, racha=${racha.rachaActual}`);

              // Obtener última asistencia
              const ultimaAsistencia = await this.asistenciaRepositorio.encontrarPorAlumnoYFecha(
                miembro.id,
                fechaObj,
              );

              return {
                id: miembro.id,
                nombre: miembro.nombre,
                email: miembro.email,
                status: asistencia ? (asistencia.status as StatusAsistencia) : null,
                racha_actual: racha.rachaActual,
                ultima_asistencia: ultimaAsistencia ? ultimaAsistencia.fecha : null,
              };
            } catch (error) {
              this.logger.error(`Error al procesar alumno ${miembro.id}:`, error);
              // En caso de error, devolver información básica sin racha
              return {
                id: miembro.id,
                nombre: miembro.nombre,
                email: miembro.email,
                status: null,
                racha_actual: 0,
                ultima_asistencia: null,
              };
            }
          }),
      );

      this.logger.log(`Asistencia consultada exitosamente: ${alumnos.length} alumnos procesados`);
      return {
        fecha,
        gymnarium: {
          id: gimnasio.id,
          nombre: gimnasio.nombre,
        },
        alumnos,
      };
    } catch (error) {
      this.logger.error(`Error al consultar asistencia: ${error.message}`, error.stack);
      throw error;
    }
  }
} 