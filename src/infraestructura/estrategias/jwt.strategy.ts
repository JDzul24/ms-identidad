import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Define el payload esperado dentro del JWT para un tipado fuerte.
 */
interface JwtPayload {
  sub: string; // ID del usuario
  email: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      // Define cómo se extraerá el token de la petición HTTP.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Asegura que los tokens expirados sean rechazados.
      ignoreExpiration: false,
      // Proporciona el secreto usado para firmar y verificar el token.
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Método de validación que Passport ejecuta automáticamente
   * si la firma y la expiración del token son válidas.
   * @param payload - El payload decodificado del token.
   * @returns Un objeto de usuario simplificado que se adjuntará a `request.user`.
   */
  async validate(payload: JwtPayload): Promise<{ userId: string; email: string; rol: string }> {
    // Verificación adicional de la integridad del payload.
    if (!payload.sub || !payload.email || !payload.rol) {
      throw new UnauthorizedException('El contenido del token es inválido.');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
  }
}
