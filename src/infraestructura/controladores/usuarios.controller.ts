import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { PerfilUsuarioService } from '../../aplicacion/servicios/perfil-usuario.service';
import { Request } from 'express';

/**
 * Interfaz para extender el objeto Request de Express y añadir la propiedad 'user',
 * que es adjuntada por la estrategia de Passport después de validar un token JWT.
 */
interface RequestConUsuario extends Request {
  user: {
    userId: string;
    email: string;
    rol: string;
  };
}

@Controller('users')
export class UsuariosController {
  constructor(
    @Inject(PerfilUsuarioService)
    private readonly perfilUsuarioService: PerfilUsuarioService,
  ) {}

  /**
   * Endpoint protegido para obtener la información del perfil del usuario
   * actualmente autenticado.
   * GET /users/me
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async obtenerMiPerfil(@Req() req: RequestConUsuario) {
    // La guardia ya validó el token. Extraemos el ID del propio usuario.
    const usuarioId = req.user.userId;
    return this.perfilUsuarioService.ejecutar(usuarioId);
  }

  /**
   * Endpoint protegido para obtener el perfil público de cualquier usuario por su ID.
   * Esencial para la comunicación entre servicios o para roles de administrador.
   * GET /users/:id
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async obtenerPerfilPorId(
    @Req() req: RequestConUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.perfilUsuarioService.ejecutar(id);
  }
}
