import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  Inject,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from '../../aplicacion/servicios/auth.service';
import { TokenRequestDto } from '../dtos/token-request.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { JwtRefreshAuthGuard } from '../../infraestructura/guardias/jwt-refresh-auth.guard';
import { Request } from 'express';
import { Usuario } from '../../dominio/entidades/usuario.entity';

// Extendemos la interfaz de Request para incluir el objeto 'user'
// que Passport adjunta después de una validación exitosa.
interface RequestConUsuario extends Request {
  user: Usuario;
}

@Controller('oauth')
export class OauthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

  /**
   * Endpoint principal para la obtención de tokens.
   * Maneja el flujo 'password' grant type de OAuth2.
   * POST /oauth/token
   */
  @Post('token')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async issueToken(@Body() tokenRequestDto: TokenRequestDto) {
    // Verificamos que se esté solicitando el grant_type correcto para este flujo
    if (tokenRequestDto.grant_type !== 'password') {
      throw new BadRequestException(
        'Tipo de concesión no soportado (unsupported_grant_type). Utilice /oauth/token/refresh para refrescar tokens.',
      );
    }

    const clienteEsValido = this.authService.validarCliente(
      tokenRequestDto.client_id,
      tokenRequestDto.client_secret,
    );
    if (!clienteEsValido) {
      throw new UnauthorizedException('Cliente inválido (invalid_client).');
    }

    const usuario = await this.authService.validarCredencialesUsuario(
      tokenRequestDto.username,
      tokenRequestDto.password,
    );
    if (!usuario) {
      throw new UnauthorizedException(
        'Credenciales de usuario inválidas (invalid_grant).',
      );
    }

    // Si todo es válido, generamos ambos tokens (access y refresh)
    return this.authService.generarTokens(usuario);
  }

  /**
   * Endpoint para refrescar un Access Token utilizando un Refresh Token.
   * POST /oauth/token/refresh
   */
  @UseGuards(JwtRefreshAuthGuard) // ¡IMPORTANTE! Protegemos la ruta con nuestra nueva guardia.
  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: RequestConUsuario) {
    // La guardia JwtRefreshAuthGuard ya ha validado el refresh token
    // y ha adjuntado la entidad del usuario en 'req.user'.
    const usuario = req.user;
    
    // Simplemente generamos un nuevo par de tokens para este usuario.
    // Esto también actualiza el refresh token en la base de datos,
    // implementando una estrategia de rotación de refresh tokens para mayor seguridad.
    return this.authService.generarTokens(usuario);
  }
}
