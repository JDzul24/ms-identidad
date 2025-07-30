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
    console.log(`🔍 SOLICITUDES: Evaluando ${miembros.length} miembros del gimnasio ${gimnasioSolicitante.id}`);
    
    const atletasPendientes = miembros
      .filter((miembro) => {
        const esAtleta = miembro.rol === 'Atleta';
        const estadoPendiente = (miembro.estadoAtleta === 'pendiente_datos' || miembro.estadoAtleta === null);
        const datosSinCapturar = !miembro.datosFisicosCapturados;
        
        const esPendiente = esAtleta && estadoPendiente && datosSinCapturar;
        
        if (esAtleta) {
          console.log(`👤 ATLETA: ${miembro.nombre} (${miembro.email})`);
          console.log(`   Estado: ${miembro.estadoAtleta || 'null'} | Datos capturados: ${miembro.datosFisicosCapturados || 'false'} | Es pendiente: ${esPendiente}`);
        }
        
        return esPendiente;
      })
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

    console.log(`✅ SOLICITUDES: ${atletasPendientes.length} atletas pendientes encontrados`);

    return atletasPendientes;
  }
} 