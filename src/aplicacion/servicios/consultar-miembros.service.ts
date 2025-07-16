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
    // La interfaz IUsuarioRepositorio se necesita para futuras validaciones,
    // como obtener el perfil completo de los miembros.
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
  ) {}

  /**
   * Ejecuta la lógica para obtener la lista de miembros de un gimnasio,
   * asegurando que el solicitante tenga los permisos adecuados.
   *
   * @param solicitanteId El ID del usuario (Entrenador/Admin) que realiza la petición.
   * @param gymId El ID del gimnasio del cual se quieren obtener los miembros.
   * @returns Un arreglo de DTOs con la información de los miembros.
   */
  async ejecutar(
    solicitanteId: string,
    gymId: string,
  ): Promise<MiembroGimnasioDto[]> {
    // 1. Obtener la lista de miembros del gimnasio solicitado.
    const miembros = await this.gimnasioRepositorio.obtenerMiembros(gymId);
    if (!miembros || miembros.length === 0) {
      // Si el gimnasio no existe o no tiene miembros, se devuelve un arreglo vacío.
      // Podríamos lanzar un NotFoundException si el gimnasio no existe,
      // pero devolver un arreglo vacío es a menudo más práctico para el frontend.
      return [];
    }

    // 2. Lógica de autorización: Verificar si el usuario que hace la petición
    //    es, de hecho, un miembro de ese gimnasio.
    const solicitanteEsMiembro = miembros.some(
      (miembro) => miembro.id === solicitanteId,
    );

    if (!solicitanteEsMiembro) {
      // Si el solicitante no es miembro, no tiene permiso para ver la lista.
      throw new ForbiddenException(
        'No tienes permiso para acceder a los recursos de este gimnasio.',
      );
    }

    // 3. Mapear las entidades de dominio a DTOs de respuesta.
    //    Esto asegura que solo se exponga la información necesaria y segura.
    return miembros.map((miembro) => {
      const miembroDto: MiembroGimnasioDto = {
        id: miembro.id,
        nombre: miembro.nombre,
        email: miembro.email,
        rol: miembro.rol,
        // La propiedad 'nivel' es opcional y podría enriquecerse en el futuro
        // con una llamada a otro microservicio si fuera necesario.
      };
      return miembroDto;
    });
  }
}
