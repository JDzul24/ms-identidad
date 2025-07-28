import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IAsistenciaRepositorio } from '../../dominio/repositorios/asistencia.repositorio';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { IRachaRepositorio } from '../../dominio/repositorios/racha.repositorio';
import { AsistenciaMasivaDto, AsistenciaActualizadaDto } from '../../infraestructura/dtos/asistencia.dto';
import { Asistencia } from '../../dominio/entidades/asistencia.entity';

@Injectable()
export class ActualizarAsistenciaService {
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
    // 1. Verificar que el gimnasio existe
    const gimnasio = await this.gimnasioRepositorio.encontrarPorId(gymId);
    if (!gimnasio) {
      throw new NotFoundException('Gimnasio no encontrado.');
    }

    // 2. Verificar que el solicitante pertenece al gimnasio
    const solicitante = await this.usuarioRepositorio.encontrarPorId(solicitanteId);
    if (!solicitante || !solicitante.gimnasio || solicitante.gimnasio.id !== gymId) {
      throw new ForbiddenException('No tienes permisos para este gimnasio.');
    }

    const fechaObj = new Date(fecha);
    const rachasActualizadas = [];

    // 3. Procesar cada asistencia
    for (const asistenciaDto of dto.asistencias) {
      // Verificar que el alumno existe y pertenece al gimnasio
      const alumno = await this.usuarioRepositorio.encontrarPorId(asistenciaDto.alumno_id);
      if (!alumno || !alumno.gimnasio || alumno.gimnasio.id !== gymId) {
        continue; // Saltar alumnos que no pertenecen al gimnasio
      }

      // Crear o actualizar asistencia
      const asistencia = Asistencia.crear({
        gymId,
        alumnoId: asistenciaDto.alumno_id,
        fecha: fechaObj,
        status: asistenciaDto.status,
      });

      await this.asistenciaRepositorio.guardar(asistencia);

      // Actualizar racha del alumno
      const racha = await this.rachaRepositorio.crearOEncontrar(asistenciaDto.alumno_id);
      const resultadoRacha = racha.actualizarRacha(asistenciaDto.status);
      await this.rachaRepositorio.actualizar(racha);

      rachasActualizadas.push({
        alumno_id: asistenciaDto.alumno_id,
        racha_anterior: resultadoRacha.rachaAnterior,
        racha_actual: resultadoRacha.rachaActual,
        accion: resultadoRacha.accion,
      });
    }

    return {
      message: 'Asistencia actualizada exitosamente',
      fecha,
      total_registrados: dto.asistencias.length,
      rachas_actualizadas: rachasActualizadas,
    };
  }
} 