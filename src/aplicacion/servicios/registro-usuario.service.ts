import {
  Inject,
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { RegistrarUsuarioDto } from '../../infraestructura/dtos/registrar-usuario.dto';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { Usuario } from '../../dominio/entidades/usuario.entity';

@Injectable()
export class RegistroUsuarioService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
  ) {}

  async ejecutar(
    dto: RegistrarUsuarioDto,
  ): Promise<{ id: string; email: string }> {
    await this.validarReglasDeNegocio(dto);

    const nuevoUsuario = await Usuario.crear({
      email: dto.email,
      passwordPlano: dto.password,
      nombre: dto.nombre,
      rol: dto.rol,
    });

    const usuarioGuardado = await this.usuarioRepositorio.guardar(nuevoUsuario);

    // Lógica futura para crear solicitud de datos y enlazar a gimnasio...

    return {
      id: usuarioGuardado.id,
      email: usuarioGuardado.email,
    };
  }

  private async validarReglasDeNegocio(
    dto: RegistrarUsuarioDto,
  ): Promise<void> {
    const usuarioExistente = await this.usuarioRepositorio.encontrarPorEmail(
      dto.email,
    );
    if (usuarioExistente) {
      throw new UnprocessableEntityException(
        'El correo electrónico ya está en uso.',
      );
    }

    const gimnasioExistente = await this.gimnasioRepositorio.encontrarPorClave(
      dto.claveGym,
    );
    if (!gimnasioExistente) {
      throw new NotFoundException(
        'La clave del gimnasio proporcionada no es válida.',
      );
    }
  }
}
