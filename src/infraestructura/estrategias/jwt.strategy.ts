import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    // --- CORRECCIÓN DE TIPADO ESTRICTO ---
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      // Lanzamos un error explícito si el secreto no está definido.
      // Esto detiene el arranque de la aplicación y deja un log claro del problema.
      throw new Error(
        'El secreto JWT (JWT_SECRET) no está definido en las variables de entorno.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // Ahora estamos 100% seguros de que es un 'string'.
    });
  }

  // El método validate puede ser síncrono si no hace llamadas asíncronas
  validate(payload: JwtPayload): {
    userId: string;
    email: string;
    rol: string;
  } {
    if (!payload.sub || !payload.email || !payload.rol) {
      throw new UnauthorizedException(
        'Token de autenticación inválido o malformado.',
      );
    }

    return {
      userId: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
  }
}
