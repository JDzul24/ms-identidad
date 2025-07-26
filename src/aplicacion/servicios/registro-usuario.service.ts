import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RegistrarUsuarioDto } from '../../infraestructura/dtos/registrar-usuario.dto';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { Usuario } from '../../dominio/entidades/usuario.entity';
import { CognitoService } from './cognito.service'; // Se importa el nuevo servicio

@Injectable()
export class RegistroUsuarioService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    // Se inyecta el nuevo servicio cliente de Cognito
    private readonly cognitoService: CognitoService,
  ) {}

  public async ejecutar(
    dto: RegistrarUsuarioDto,
  ): Promise<{ id: string; email: string }> {
    // 1. La primera validación de existencia se delega a Cognito.
    //    Si el email ya existe allí, el método 'crearUsuarioAdministrativamente'
    //    lanzará una excepción que será capturada por el controlador.
    const cognitoUserId = await this.cognitoService.crearUsuarioAdministrativamente(
      dto.email,
      dto.nombre,
      dto.rol,
    );

    // Es una buena práctica verificar también en nuestra base de datos
    // por si hubiera una desincronización.
    const usuarioLocalExistente = await this.usuarioRepositorio.encontrarPorId(cognitoUserId);
    if (usuarioLocalExistente) {
      throw new UnprocessableEntityException(
        'El usuario ya existe en la base de datos local pero no debería.'
      );
    }
    
    // 2. Crear la entidad de dominio Usuario, usando el ID de Cognito (sub).
    //    El password ya no es necesario aquí, Cognito lo gestiona.
    const nuevoUsuario = Usuario.crearSincronizado({
      id: cognitoUserId, // Se usa el ID de Cognito
      email: dto.email,
      nombre: dto.nombre,
      rol: dto.rol,
    });

    // 3. Persistir el nuevo usuario en nuestra base de datos.
    const usuarioGuardado = await this.usuarioRepositorio.guardar(nuevoUsuario);
    
    return {
      id: usuarioGuardado.id,
      email: usuarioGuardado.email,
    };
  }
}
