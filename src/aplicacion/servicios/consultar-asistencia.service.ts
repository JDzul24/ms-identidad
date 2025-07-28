import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IAsistenciaRepositorio } from '../../dominio/repositorios/asistencia.repositorio';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { IRachaRepositorio } from '../../dominio/repositorios/racha.repositorio';
import { AsistenciaGymDto, AlumnoAsistenciaDto, StatusAsistencia } from '../../infraestructura/dtos/asistencia.dto';

@Injectable()
export class ConsultarAsistenciaService {
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

    // 3. Obtener todos los miembros del gimnasio
    const miembros = await this.gimnasioRepositorio.obtenerMiembros(gymId);
    const fechaObj = new Date(fecha);

    // 4. Para cada miembro, obtener su asistencia y racha
    const alumnos: AlumnoAsistenciaDto[] = await Promise.all(
      miembros
        .filter((miembro) => miembro.rol === 'Atleta')
        .map(async (miembro) => {
          // Obtener asistencia para la fecha
          const asistencia = await this.asistenciaRepositorio.encontrarPorGymAlumnoYFecha(
            gymId,
            miembro.id,
            fechaObj,
          );

          // Obtener racha del alumno
          const racha = await this.rachaRepositorio.crearOEncontrar(miembro.id);

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
        }),
    );

    return {
      fecha,
      gymnarium: {
        id: gimnasio.id,
        nombre: gimnasio.nombre,
      },
      alumnos,
    };
  }
} 