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

    return validClients.some(client => 
      clientId === client.id && clientSecret === client.secret
    );
  }

    public async validarCredencialesUsuario(
    email: string,
    pass: string,
  ): Promise<Usuario | null> {
    const usuario = await this.usuarioRepositorio.encontrarPorEmail(email);
    if (usuario && (await bcrypt.compare(pass, usuario.obtenerPasswordHash()))) {
      if (!usuario.estaVerificado()) {
        throw new UnauthorizedException('Por favor, confirma tu correo electrónico para iniciar sesión.');
      }
      return usuario;
    }
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
