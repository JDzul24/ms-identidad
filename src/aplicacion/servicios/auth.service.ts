import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { Usuario } from '../../dominio/entidades/usuario.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public validarCliente(clientId: string, clientSecret: string): boolean {
    // Clientes válidos para diferentes aplicaciones
    const validClients = [
      {
        id: 'capbox-mobile-app',
        secret: 'capbox-secret-key-2024'
      },
      {
        id: 'capbox-web-admin',
        secret: 'capbox-web-secret-2024'
      }
    ];

    console.log('🔍 DEBUG: Validando cliente');
    console.log('🔍 DEBUG: Client ID recibido:', clientId);
    console.log('🔍 DEBUG: Client Secret recibido:', clientSecret);
    console.log('🔍 DEBUG: Clientes válidos:', validClients.map(c => ({ id: c.id, secret: c.secret.substring(0, 10) + '...' })));

    const esValido = validClients.some(client => 
      clientId === client.id && clientSecret === client.secret
    );

    console.log('🔍 DEBUG: Cliente válido:', esValido);
    return esValido;
  }

  public async validarCredencialesUsuario(
    email: string,
    pass: string,
  ): Promise<Usuario | null> {
    console.log('🔍 DEBUG: Validando credenciales de usuario');
    console.log('🔍 DEBUG: Email recibido:', email);
    
    const usuario = await this.usuarioRepositorio.encontrarPorEmail(email);
    console.log('🔍 DEBUG: Usuario encontrado:', !!usuario);
    
    if (usuario) {
      console.log('🔍 DEBUG: Usuario verificado:', usuario.estaVerificado());
      const passwordValido = await bcrypt.compare(pass, usuario.obtenerPasswordHash());
      console.log('🔍 DEBUG: Password válido:', passwordValido);
      
      if (passwordValido) {
        if (!usuario.estaVerificado()) {
          console.log('🔍 DEBUG: Usuario no verificado, lanzando excepción');
          throw new UnauthorizedException('Por favor, confirma tu correo electrónico para iniciar sesión.');
        }
        console.log('🔍 DEBUG: Usuario válido y verificado');
        return usuario;
      }
    }
    
    console.log('🔍 DEBUG: Usuario inválido o no encontrado');
    return null;
  }

  public async generarTokens(
    usuario: Usuario,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const jwtIssuerUrl = this.configService.get<string>('JWT_ISSUER_URL');
    // AÑADIDO: Obtener la audiencia desde la configuración
    const jwtAudience = this.configService.get<string>('JWT_AUDIENCE');

    const accessTokenPayload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      iss: jwtIssuerUrl,
      // AÑADIDO: Incluir la audiencia en el payload del access token
      aud: jwtAudience,
    };
    const refreshTokenPayload = {
      sub: usuario.id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION'),
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION'),
      }),
    ]);

    await this.usuarioRepositorio.actualizarRefreshToken(
      usuario.id,
      refreshToken,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  public async validarUsuarioPorRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<Usuario | null> {
    const usuario = await this.usuarioRepositorio.encontrarPorId(userId);
    if (!usuario || !usuario.obtenerRefreshTokenHash()) {
      return null;
    }
    const refreshTokenValido = await bcrypt.compare(
      refreshToken,
      usuario.obtenerRefreshTokenHash(),
    );
    return refreshTokenValido ? usuario : null;
  }

  /**
   * Cierra la sesión de un usuario invalidando su refresh token.
   * @param usuarioId El ID del usuario que está cerrando sesión.
   */
  public async cerrarSesion(usuarioId: string): Promise<{ mensaje: string }> {
    // La forma de invalidar el refresh token es simplemente eliminarlo de la base de datos.
    await this.usuarioRepositorio.actualizarRefreshToken(usuarioId, null);
    return { mensaje: 'Sesión cerrada con éxito.' };
  }

  public async solicitarReseteoPassword(
    email: string,
  ): Promise<{ mensaje: string }> {
    const usuario = await this.usuarioRepositorio.encontrarPorEmail(email);
    if (!usuario) {
      return {
        mensaje:
          'Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.',
      };
    }
    // El token de reseteo no necesita el 'iss' o 'aud' para la validación interna
    const tokenPayload = { sub: usuario.id, type: 'password-reset' };
    const resetToken = this.jwtService.sign(tokenPayload, { expiresIn: '15m' });
    console.log(
      `[SIMULACIÓN DE EMAIL] Enviando a: ${usuario.email} con el siguiente token de reseteo: ${resetToken}`,
    );
    return {
      mensaje:
        'Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.',
    };
  }

  public async resetearPassword(
    token: string,
    nuevaPassword: string,
  ): Promise<{ mensaje: string }> {
    try {
      const payload: { sub: string; type: string } =
        this.jwtService.verify(token);
      if (payload.type !== 'password-reset') {
        throw new UnauthorizedException('Token inválido para esta operación.');
      }
      const usuario = await this.usuarioRepositorio.encontrarPorId(payload.sub);
      if (!usuario) {
        throw new NotFoundException('Usuario asociado al token no encontrado.');
      }
      await this.usuarioRepositorio.actualizarPassword(
        usuario.id,
        nuevaPassword,
      );
      return { mensaje: 'Contraseña actualizada con éxito.' };
    } catch (error) {
      throw new UnauthorizedException(
        'El token de restablecimiento es inválido o ha expirado.',
      );
    }
  }
}
