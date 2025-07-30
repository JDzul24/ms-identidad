import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { MiembroGimnasioDto } from '../../infraestructura/dtos/miembro-gimnasio.dto';

@Injectable()
export class ConsultarMiembrosService {
  constructor(
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
  ) {}

  /**
   * Ejecuta la lógica para obtener la lista de miembros de un gimnasio,
   * asegurando que el solicitante tenga los permisos adecuados.
   *
   * @param solicitanteId El ID del usuario (Entrenador/Admin) que realiza la petición.
   * @param gymId El ID del gimnasio del cual se quieren obtener los miembros.
   * @returns Un arreglo de DTOs con la información de los miembros, incluyendo el nivel si son atletas.
   */
  async ejecutar(
    solicitanteId: string,
    gymId: string,
  ): Promise<MiembroGimnasioDto[]> {
    const miembros = await this.gimnasioRepositorio.obtenerMiembros(gymId);
    if (!miembros || miembros.length === 0) {
      return [];
    }

    const solicitanteEsMiembro = miembros.some(
      (miembro) => miembro.id === solicitanteId,
    );
    if (!solicitanteEsMiembro) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a los recursos de este gimnasio.',
      );
    }

    // Mapeamos las entidades de dominio a DTOs de respuesta,
    // incluyendo la información del perfil del atleta.
    return miembros.map((miembro) => {
      const miembroDto: MiembroGimnasioDto = {
        id: miembro.id,
        nombre: miembro.nombre,
        email: miembro.email,
        rol: miembro.rol,
        // Si el miembro es un atleta y tiene un perfil, añadimos su nivel.
        nivel: miembro.perfilAtleta ? miembro.perfilAtleta.nivel : null,
        // ✅ AGREGADO: Estado del atleta y datos físicos capturados
        estado_atleta: miembro.estadoAtleta || 'pendiente_datos',
        datos_fisicos_capturados: miembro.datosFisicosCapturados || false,
      };
      return miembroDto;
    });
  }
}
