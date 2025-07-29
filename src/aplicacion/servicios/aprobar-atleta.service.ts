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
    // ✅ NUEVA VALIDACIÓN SIMPLIFICADA: Solo verificar que sea coach o admin
    const coach = await this.usuarioRepositorio.encontrarPorId(coachId);
    if (!coach) {
      throw new NotFoundException('Coach no encontrado.');
    }

    // ✅ ELIMINADA VALIDACIÓN DE estadoAtleta - coaches siempre pueden aprobar
    if (coach.rol !== 'Entrenador' && coach.rol !== 'Admin') {
      throw new ForbiddenException('Solo coaches y admins pueden aprobar atletas.');
    }

    const solicitud = await this.solicitudRepositorio.encontrarPorIdAtleta(
      atletaId,
    );
    if (!solicitud) {
      throw new NotFoundException(
        `No se encontró una solicitud pendiente para el atleta con ID ${atletaId}.`,
      );
    }

    if (solicitud.coachId !== coachId) {
      throw new ForbiddenException('No tienes permiso para aprobar a este atleta.');
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
