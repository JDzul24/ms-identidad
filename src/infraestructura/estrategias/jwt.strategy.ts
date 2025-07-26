import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config'; // <-- IMPORTAR

interface JwtPayload { sub: string; email: string; rol: string; }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // --- CORRECCIÓN DEFINITIVA ---
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Usamos el ConfigService para obtener la variable de entorno de forma segura
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): { userId: string; email: string; rol: string } {
    if (!payload.sub || !payload.email || !payload.rol) {
      throw new UnauthorizedException('Token inválido.');
    }
    return { userId: payload.sub, email: payload.email, rol: payload.rol };
  }
}
