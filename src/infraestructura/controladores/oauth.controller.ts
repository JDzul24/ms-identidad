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
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { Gimnasio } from '../../dominio/entidades/gimnasio.entity';

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
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
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

    let usuario = await this.authService.validarCredencialesUsuario(
      tokenRequestDto.username,
      tokenRequestDto.password,
    );
    if (!usuario) {
      throw new UnauthorizedException(
        'Credenciales de usuario inválidas (invalid_grant).',
      );
    }

    // ✅ AUTO-FIX: Auto-vinculación de admin si no tiene gimnasio
    if (usuario.rol === 'Admin' && !usuario.gimnasio) {
      console.log('⚠️ OAUTH: Admin sin gimnasio detectado, creando uno por defecto:', usuario.email);
      
      try {
        const nombreGimnasio = `Gimnasio de ${usuario.nombre}`;
        
        const gimnasio = Gimnasio.crear({
          ownerId: usuario.id,
          nombre: nombreGimnasio,
          tamaño: 'mediano',
          totalBoxeadores: 0,
          ubicacion: 'Por definir',
          imagenUrl: null,
          gymKey: this.generarClaveGimnasio(nombreGimnasio),
        });

        const gimnasioGuardado = await this.gimnasioRepositorio.guardar(gimnasio);
        
        // ✅ CORRECCIÓN: Recargar el usuario para obtener el gimnasio recién creado
        const usuarioActualizado = await this.authService.validarCredencialesUsuario(
          tokenRequestDto.username,
          tokenRequestDto.password,
        );
        if (usuarioActualizado) {
          usuario = usuarioActualizado;
        }
        
        console.log('✅ OAUTH: Gimnasio creado automáticamente para admin:', usuario.email);
      } catch (error) {
        console.error('❌ OAUTH: Error creando gimnasio automáticamente:', error);
        // Continuar sin fallar el login
      }
    }

    // Si todo es válido, generamos ambos tokens (access y refresh)
    return this.authService.generarTokens(usuario);
  }

  private generarClaveGimnasio(nombreGimnasio: string): string {
    // Generar clave basada en el nombre del gimnasio
    const nombreLimpio = nombreGimnasio.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const timestamp = Date.now().toString().slice(-3);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    return `${nombreLimpio.slice(0, 3)}${timestamp}${random}`;
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
