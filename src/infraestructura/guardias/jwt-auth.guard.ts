import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Una guardia que protege las rutas activando la estrategia 'jwt' de Passport.
 * Rechazará automáticamente cualquier petición que no tenga un Access Token válido
 * en la cabecera 'Authorization: Bearer <token>'.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}