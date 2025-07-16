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

@Injectable()
export class AprobarAtletaService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    @Inject('ISolicitudRepositorio')
    private readonly solicitudRepositorio: ISolicitudRepositorio,
  ) {}

  /**
   * Ejecuta el caso de uso para aprobar un atleta y registrar sus datos físicos.
   * @param coachId - El ID del entrenador que realiza la acción (del token).
   * @param atletaId - El ID del atleta a aprobar (de la URL).
   * @param dto - Los datos físicos del atleta.
   */
  async ejecutar(
    coachId: string,
    atletaId: string,
    dto: AprobarAtletaDto,
  ): Promise<{ mensaje: string }> {
    // 1. Buscar la solicitud para asegurarse de que existe y está pendiente.
    const solicitud = await this.solicitudRepositorio.encontrarPorIdAtleta(atletaId);
    if (!solicitud) {
      throw new NotFoundException(`No se encontró una solicitud pendiente para el atleta con ID ${atletaId}.`);
    }

    // 2. Validar autorización: el entrenador que aprueba debe ser el mismo al que se le asignó la solicitud.
    if (solicitud.coachId !== coachId) {
      throw new ForbiddenException('No tienes permiso para aprobar a este atleta.');
    }
    
    // 3. Validar estado: no se puede aprobar una solicitud ya completada.
    if (solicitud.status === 'COMPLETADA') {
        throw new UnprocessableEntityException('Esta solicitud ya ha sido procesada.');
    }

    // 4. Actualizar el perfil del atleta con los nuevos datos.
    await this.usuarioRepositorio.actualizarPerfilAtleta(atletaId, {
      nivel: dto.nivel,
      alturaCm: dto.alturaCm,
      pesoKg: dto.pesoKg,
      guardia: dto.guardia,
      alergias: dto.alergias,
      contactoEmergenciaNombre: dto.contactoEmergenciaNombre,
      contactoEmergenciaTelefono: dto.contactoEmergenciaTelefono,
    });
    
    // 5. Marcar la solicitud como completada.
    solicitud.completar();
    await this.solicitudRepositorio.actualizar(solicitud);
    
    // (Opcional) Aquí se podría disparar un evento `AtletaAprobado` para notificar al atleta.

    return { mensaje: 'Atleta aprobado y perfil actualizado con éxito.' };
  }
}