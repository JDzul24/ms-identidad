import {
  Controller,
  Post,
  Get,
  Body,
  ValidationPipe,
  UsePipes,
  HttpException,
  HttpStatus,
  Inject,
  HttpCode,
  UseGuards, 
  Req,     
} from '@nestjs/common';
import { Request } from 'express';
import { RegistrarUsuarioDto } from '../dtos/registrar-usuario.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { RegistroUsuarioService } from '../../aplicacion/servicios/registro-usuario.service';
import { AuthService } from '../../aplicacion/servicios/auth.service';
import { JwtAuthGuard } from '../../infraestructura/guardias/jwt-auth.guard';


// Definimos la interfaz para el request con el usuario adjunto por Passport
interface RequestConUsuario extends Request {
  user: {
    userId: string;
    email: string;
    rol: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(RegistroUsuarioService)
    private readonly registroUsuarioService: RegistroUsuarioService,
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

  /**
   * Endpoint de health check para el servicio de autenticación.
   * GET /auth
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async healthCheck() {
    return {
      statusCode: HttpStatus.OK,
      message: 'Servicio de autenticación disponible',
      service: 'ms-identidad',
      version: '1.8.0',
      endpoints: {
        login: 'POST /oauth/token',
        register: 'POST /auth/register',
        logout: 'POST /auth/logout'
      }
    };
  }



  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async registrarUsuario(@Body() registrarUsuarioDto: RegistrarUsuarioDto) {
    try {
      const resultado = await this.registroUsuarioService.ejecutar(
        registrarUsuarioDto,
      );
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Usuario registrado con éxito. Pendiente de aprobación.',
        data: resultado,
      };
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error instanceof Error ? error.message : 'Error interno del servidor.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    try {
      return await this.authService.solicitarReseteoPassword(
        forgotPasswordDto.email,
      );
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error instanceof Error ? error.message : 'Error interno del servidor.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      return await this.authService.resetearPassword(
        resetPasswordDto.token,
        resetPasswordDto.nuevaPassword,
      );
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error instanceof Error ? error.message : 'Error interno del servidor.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }

  /**
   * Endpoint protegido para cerrar la sesión del usuario.
   * Invalida el refresh token del usuario para que no pueda ser usado de nuevo.
   * POST /auth/logout
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard) // <-- Se protege la ruta con la guardia JWT
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: RequestConUsuario) {
    // La guardia JwtAuthGuard asegura que req.user exista y contenga el payload del token.
    const { userId } = req.user;
    return this.authService.cerrarSesion(userId);
  }
}
