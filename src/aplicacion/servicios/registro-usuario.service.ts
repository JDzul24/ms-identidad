import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RegistrarUsuarioDto } from '../../infraestructura/dtos/registrar-usuario.dto';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { Usuario } from '../../dominio/entidades/usuario.entity';

@Injectable()
export class RegistroUsuarioService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
  ) {}

  public async ejecutar(
    dto: RegistrarUsuarioDto,
  ): Promise<{ id: string; email: string }> {
    // 1. Validar que el email no esté ya en uso.
    const usuarioExistente = await this.usuarioRepositorio.encontrarPorEmail(
      dto.email,
    );
    if (usuarioExistente) {
      throw new UnprocessableEntityException(
        'El correo electrónico ya está en uso.',
      );
    }

    // 2. Crear la entidad de dominio Usuario.
    const nuevoUsuario = await Usuario.crear({
      email: dto.email,
      passwordPlano: dto.password,
      nombre: dto.nombre,
      rol: dto.rol,
    });

    // 3. Persistir el nuevo usuario en la base de datos.
    const usuarioGuardado = await this.usuarioRepositorio.guardar(nuevoUsuario);

    // La lógica de asociación a gimnasio y creación de solicitud se ha movido
    // a un nuevo servicio de vinculación post-login.

    return {
      id: usuarioGuardado.id,
      email: usuarioGuardado.email,
    };
  }
}
