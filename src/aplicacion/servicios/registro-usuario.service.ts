import {
  Inject,
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { RegistrarUsuarioDto } from '../../infraestructura/dtos/registrar-usuario.dto';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { ISolicitudRepositorio } from '../../dominio/repositorios/solicitud.repositorio';
import { Usuario } from '../../dominio/entidades/usuario.entity';
import { Gimnasio } from '../../dominio/entidades/gimnasio.entity';
import { SolicitudDatos } from '../../dominio/entidades/solicitud-datos.entity';

@Injectable()
export class RegistroUsuarioService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
    @Inject('ISolicitudRepositorio')
    private readonly solicitudRepositorio: ISolicitudRepositorio,
  ) {}

  public async ejecutar(
    dto: RegistrarUsuarioDto,
  ): Promise<{ id: string; email: string }> {
    const gimnasio = await this.validarReglasDeNegocio(dto);

    // 1. Crear la entidad de dominio Usuario.
    const nuevoUsuario = await Usuario.crear({
      email: dto.email,
      passwordPlano: dto.password,
      nombre: dto.nombre,
      rol: dto.rol,
    });

    // 2. Persistir el nuevo usuario en la base de datos.
    const usuarioGuardado = await this.usuarioRepositorio.guardar(nuevoUsuario);

    // 3. Crear la relación entre el usuario y el gimnasio.
    await this.usuarioRepositorio.asociarAGimnasio(
      usuarioGuardado.id,
      gimnasio.id,
    );

    // 4. Si el nuevo usuario es un Atleta, generar la solicitud de aprobación de datos.
    if (usuarioGuardado.rol === 'Atleta') {
      const nuevaSolicitud = SolicitudDatos.crear({
        atletaId: usuarioGuardado.id,
        coachId: gimnasio.ownerId, // La solicitud se asigna al dueño del gimnasio.
      });
      await this.solicitudRepositorio.guardar(nuevaSolicitud);
    }

    // 5. Devolver la respuesta.
    return {
      id: usuarioGuardado.id,
      email: usuarioGuardado.email,
    };
  }

  private async validarReglasDeNegocio(
    dto: RegistrarUsuarioDto,
  ): Promise<Gimnasio> {
    // Validar que el email no esté ya en uso.
    const usuarioExistente = await this.usuarioRepositorio.encontrarPorEmail(
      dto.email,
    );
    if (usuarioExistente) {
      throw new UnprocessableEntityException(
        'El correo electrónico ya está en uso.',
      );
    }

    // Validar que la clave del gimnasio sea correcta y obtener los datos del gimnasio.
    const gimnasioExistente =
      await this.gimnasioRepositorio.encontrarPorClave(dto.claveGym);
    if (!gimnasioExistente) {
      throw new NotFoundException(
        'La clave del gimnasio proporcionada no es válida.',
      );
    }
    return gimnasioExistente;
  }
}
