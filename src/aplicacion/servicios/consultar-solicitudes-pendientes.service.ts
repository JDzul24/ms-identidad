import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { AtletaPendienteDto } from '../../infraestructura/dtos/solicitudes-pendientes.dto';

@Injectable()
export class ConsultarSolicitudesPendientesService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
  ) {}

  async ejecutar(solicitanteId: string): Promise<AtletaPendienteDto[]> {
    // 1. Verificar que el solicitante existe y es Coach o Admin
    const solicitante = await this.usuarioRepositorio.encontrarPorId(solicitanteId);
    if (!solicitante || !['Admin', 'Entrenador'].includes(solicitante.rol)) {
      throw new ForbiddenException('No tienes permisos para ver solicitudes pendientes.');
    }

    // 2. Obtener el gimnasio del solicitante
    const gimnasioSolicitante = solicitante.gimnasio;
    if (!gimnasioSolicitante) {
      throw new ForbiddenException('No tienes un gimnasio asignado.');
    }

    // 3. Obtener todos los miembros del gimnasio
    const miembros = await this.gimnasioRepositorio.obtenerMiembros(gimnasioSolicitante.id);

    // 4. Filtrar solo atletas pendientes de datos
    const atletasPendientes = miembros
      .filter((miembro) => 
        miembro.rol === 'Atleta' && 
        (miembro.estadoAtleta === 'pendiente_datos' || !miembro.datosFisicosCapturados)
      )
      .map((atleta) => ({
        id: atleta.id,
        name: atleta.nombre,
        email: atleta.email,
        role: atleta.rol,
        estado_atleta: atleta.estadoAtleta || 'pendiente_datos',
        datos_fisicos_capturados: atleta.datosFisicosCapturados || false,
        fecha_registro: atleta.createdAt,
        gimnasio: atleta.gimnasio ? {
          id: atleta.gimnasio.id,
          nombre: atleta.gimnasio.nombre,
        } : null,
      }));

    return atletasPendientes;
  }
} 