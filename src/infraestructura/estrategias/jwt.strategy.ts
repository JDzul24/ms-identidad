import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Define la estructura del payload que realmente se firma en auth.service.ts
interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
}

// Define la estructura del objeto 'user' que se adjuntará al request
export interface UsuarioPayload {
  userId: string;
  email: string;

  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // ¡CORREGIDO! Ya no se ignora la expiración.
      ignoreExpiration: false,
      // ¡CORREGIDO! Se usa el secreto real desde la configuración.
      // El servicio ahora validará la firma de los tokens que él mismo emite.
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Este método se ejecuta DESPUÉS de que Passport ha verificado
   * la firma y la expiración del JWT.
   * El payload que llega aquí es seguro y de confianza.
   */
  async validate(payload: JwtPayload): Promise<UsuarioPayload> {
    // Simplemente reenviamos los datos del token en un formato estandarizado
    // para que esté disponible en `req.user` en todos los controladores.
    return {
      userId: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
  }
}
