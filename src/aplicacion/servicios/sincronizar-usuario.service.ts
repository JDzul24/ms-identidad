import { Inject, Injectable } from '@nestjs/common';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { PerfilUsuarioDto } from '../../infraestructura/dtos/perfil-usuario.dto';
import { Usuario, RolUsuario } from '../../dominio/entidades/usuario.entity';

// Define la estructura de los datos del usuario que vienen del token JWT.
interface DatosUsuarioToken {
  id: string;      // Mapeado del 'sub'
  email: string;
  nombre: string;
  rol: RolUsuario;
}

@Injectable()
export class SincronizarUsuarioService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
  ) {}

  /**
   * Ejecuta la lógica para sincronizar un usuario de Cognito con la base de datos local.
   *
   * @param datosToken Los datos del usuario extraídos del token JWT decodificado.
   * @returns El perfil de usuario completo desde la base de datos local.
   */
  async ejecutar(datosToken: DatosUsuarioToken): Promise<PerfilUsuarioDto> {
    // 1. Verificar si el usuario ya existe en nuestra base de datos.
    const usuarioExistente = await this.usuarioRepositorio.encontrarPorId(
      datosToken.id,
    );

    if (usuarioExistente) {
      // Si ya existe, simplemente lo devolvemos para construir el DTO.
      return this.mapearAPerfilDto(usuarioExistente);
    }

    // 2. Si el usuario no existe, lo creamos en nuestra base de datos.
    // Usamos un método de fábrica que no requiere contraseña.
    const nuevoUsuario = Usuario.crearSincronizado({
      id: datosToken.id,
      email: datosToken.email,
      nombre: datosToken.nombre,
      rol: datosToken.rol,
    });

    const usuarioGuardado = await this.usuarioRepositorio.guardar(nuevoUsuario);

    // 3. Devolvemos el perfil del usuario recién creado.
    return this.mapearAPerfilDto(usuarioGuardado);
  }

  /**
   * Mapea una entidad de dominio Usuario a un DTO de respuesta PerfilUsuarioDto.
   * Centraliza la lógica de mapeo para evitar duplicación.
   */
  private mapearAPerfilDto(usuario: Usuario): PerfilUsuarioDto {
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      gimnasio: usuario.gimnasio
        ? {
            id: usuario.gimnasio.id,
            nombre: usuario.gimnasio.nombre,
          }
        : null,
      perfilAtleta: usuario.perfilAtleta,
    };
  }
}
