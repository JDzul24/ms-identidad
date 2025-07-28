import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IRachaRepositorio } from '../../dominio/repositorios/racha.repositorio';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { IAsistenciaRepositorio } from '../../dominio/repositorios/asistencia.repositorio';
import { RachaDto } from '../../infraestructura/dtos/racha.dto';

@Injectable()
export class ConsultarRachaService {
  constructor(
    @Inject('IRachaRepositorio')
    private readonly rachaRepositorio: IRachaRepositorio,
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    @Inject('IAsistenciaRepositorio')
    private readonly asistenciaRepositorio: IAsistenciaRepositorio,
  ) {}

  async ejecutar(usuarioId: string, solicitanteId: string): Promise<RachaDto> {
    // 1. Verificar que el usuario existe
    const usuario = await this.usuarioRepositorio.encontrarPorId(usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // 2. Verificar permisos (el usuario puede ver su propia racha o ser admin/coach)
    if (solicitanteId !== usuarioId) {
      const solicitante = await this.usuarioRepositorio.encontrarPorId(solicitanteId);
      if (!solicitante || !['Admin', 'Entrenador'].includes(solicitante.rol)) {
        throw new ForbiddenException('No tienes permisos para ver esta racha.');
      }
    }

    // 3. Obtener o crear racha
    const racha = await this.rachaRepositorio.crearOEncontrar(usuarioId);

    // 4. Obtener días consecutivos (últimos 7 días)
    const diasConsecutivos = [];
    const hoy = new Date();
    
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      
      const asistencia = await this.asistenciaRepositorio.encontrarPorAlumnoYFecha(
        usuarioId,
        fecha,
      );

      diasConsecutivos.push({
        fecha: fecha.toISOString().split('T')[0],
        status: asistencia ? asistencia.status : null,
      });
    }

    return {
      usuario_id: usuarioId,
      racha_actual: racha.rachaActual,
      estado: racha.estado,
      ultima_actualizacion: racha.ultimaActualizacion,
      record_personal: racha.recordPersonal,
      dias_consecutivos: diasConsecutivos,
    };
  }
} 