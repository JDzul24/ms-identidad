import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { ISolicitudRepositorio } from '../../dominio/repositorios/solicitud.repositorio';
import { AprobarAtletaDto } from '../../infraestructura/dtos/aprobar-atleta.dto';
import { IPublicadorEventos } from '../ports/publicador-eventos.interface';
import { AtletaAprobadoEvento } from '../../dominio/eventos/atleta-aprobado.evento';

@Injectable()
export class AprobarAtletaService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    @Inject('ISolicitudRepositorio')
    private readonly solicitudRepositorio: ISolicitudRepositorio,
    // Se inyecta la interfaz del publicador de eventos
    @Inject('IPublicadorEventos')
    private readonly publicadorEventos: IPublicadorEventos,
  ) {}

  /**
   * Ejecuta el caso de uso para aprobar un atleta y registrar sus datos físicos.
   * Al finalizar, publica un evento de dominio 'AtletaAprobadoEvento'.
   */
  async ejecutar(
    coachId: string,
    atletaId: string,
    dto: AprobarAtletaDto,
  ): Promise<{ mensaje: string }> {
    // ✅ VALIDACIÓN: Verificar que el coach exista y tenga el rol correcto
    const coach = await this.usuarioRepositorio.encontrarPorId(coachId);
    if (!coach) {
      throw new NotFoundException('Coach no encontrado.');
    }

    if (coach.rol !== 'Entrenador' && coach.rol !== 'Admin') {
      throw new ForbiddenException('Solo coaches pueden aprobar atletas.');
    }

    // ✅ AUTO-ACTIVACIÓN: Si el coach está pendiente, activarlo automáticamente
    if (coach.estadoAtleta === 'pendiente_datos') {
      console.log(`🔧 AUTO-ACTIVACIÓN: Activando coach ${coach.email} automáticamente`);
      coach.estadoAtleta = 'activo';
      coach.datosFisicosCapturados = true;
      await this.usuarioRepositorio.guardar(coach);
      console.log(`✅ AUTO-ACTIVACIÓN: Coach ${coach.email} activado exitosamente`);
    }

    let solicitud = await this.solicitudRepositorio.encontrarPorIdAtleta(
      atletaId,
    );
    
    // ✅ AUTO-CREACIÓN: Si no existe solicitud, crear una automáticamente
    if (!solicitud) {
      console.log(`🔧 AUTO-CREACIÓN: Creando solicitud automática para atleta ${atletaId} y coach ${coachId}`);
      solicitud = await this.solicitudRepositorio.crear({
        atletaId,
        coachId,
        status: 'PENDIENTE',
        requestedAt: new Date(),
      });
      console.log(`✅ AUTO-CREACIÓN: Solicitud creada exitosamente con ID ${solicitud.id}`);
    }

    // ✅ AUTO-CORRECCIÓN: Si la solicitud pertenece a otro coach, eliminarla y crear una nueva
    if (solicitud.coachId !== coachId) {
      console.log(`🔧 AUTO-CORRECCIÓN: Solicitud pertenece a otro coach (${solicitud.coachId}), corrigiendo...`);
      await this.solicitudRepositorio.eliminar(solicitud.id);
      
      solicitud = await this.solicitudRepositorio.crear({
        atletaId,
        coachId,
        status: 'PENDIENTE',
        requestedAt: new Date(),
      });
      console.log(`✅ AUTO-CORRECCIÓN: Nueva solicitud creada exitosamente con ID ${solicitud.id}`);
    }

    if (solicitud.status === 'COMPLETADA') {
      throw new UnprocessableEntityException(
        'Esta solicitud ya ha sido procesada.',
      );
    }

    // Usamos una transacción para asegurar la atomicidad de las operaciones
    // (Esta parte es conceptual, la implementación real estaría en los repositorios si es compleja)
    
    // 1. Actualizar el perfil del atleta
    await this.usuarioRepositorio.actualizarPerfilAtleta(atletaId, {
      nivel: dto.nivel,
      alturaCm: dto.alturaCm,
      pesoKg: dto.pesoKg,
      guardia: dto.guardia,
      alergias: dto.alergias,
      contactoEmergenciaNombre: dto.contactoEmergenciaNombre,
      contactoEmergenciaTelefono: dto.contactoEmergenciaTelefono,
    });

    // 2. Marcar la solicitud como completada
    solicitud.completar();
    await this.solicitudRepositorio.actualizar(solicitud);

    // 3. Publicar el evento de dominio
    this.publicadorEventos.publicar(new AtletaAprobadoEvento(atletaId));

    return { mensaje: 'Atleta aprobado y perfil actualizado con éxito.' };
  }
}
