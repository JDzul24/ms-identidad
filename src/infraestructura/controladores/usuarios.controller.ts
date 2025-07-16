import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../infraestructura/guardias/jwt-auth.guard';
import { PerfilUsuarioService } from '../../aplicacion/servicios/perfil-usuario.service';
import { Request } from 'express';

// Definimos una interfaz para extender el objeto Request de Express
// y añadir la propiedad 'user' que Passport adjunta.
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
  @UseGuards(JwtAuthGuard) // ¡IMPORTANTE! Esta línea protege la ruta.
  @Get('me')
  async obtenerMiPerfil(@Req() req: RequestConUsuario) {
    // Gracias a JwtStrategy y JwtAuthGuard, el objeto 'req.user'
    // ya contiene el payload decodificado y validado del token.
    const usuarioId = req.user.userId;
    return this.perfilUsuarioService.ejecutar(usuarioId);
  }
}