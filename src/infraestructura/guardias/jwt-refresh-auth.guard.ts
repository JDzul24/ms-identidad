import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Una guardia que protege la ruta de refresco de token.
 * Activa la estrategia 'jwt-refresh' que hemos creado, la cual se encarga
 * de validar el refresh token proporcionado.
 */
@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {}
