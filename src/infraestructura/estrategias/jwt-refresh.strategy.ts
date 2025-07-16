import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../aplicacion/servicios/auth.service';

interface JwtPayload {
  sub: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true, // Pasamos el objeto request completo al callback de validación
    });
  }

  /**
   * Passport llama a este método después de decodificar el refresh token.
   * @param req - El objeto de la petición HTTP.
   * @param payload - El payload decodificado del refresh token.
   * @returns El objeto de usuario si la validación es exitosa.
   * @throws UnauthorizedException si la validación falla.
   */
  async validate(req: Request, payload: JwtPayload): Promise<any> {
    const refreshToken = req.body.refresh_token as string;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no proporcionado.');
    }

    // Validamos que el usuario exista y que el refresh token coincida con el almacenado
    const usuario = await this.authService.validarUsuarioPorRefreshToken(
      payload.sub,
      refreshToken,
    );
    if (!usuario) {
      throw new UnauthorizedException('Refresh token inválido o revocado.');
    }

    // Adjuntamos el usuario al objeto request para usarlo en el controlador
    return usuario;
  }
}
