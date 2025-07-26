import {
  Controller,
  Get,
  Post, // Se añade Post
  Inject,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
  ForbiddenException,
  Patch,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { PerfilUsuarioService } from '../../aplicacion/servicios/perfil-usuario.service';
import { Request } from 'express';
import { ObtenerClaveGimnasioService } from '../../aplicacion/servicios/obtener-clave-gimnasio.service';
import { ModificarClaveGimnasioService } from '../../aplicacion/servicios/modificar-clave-gimnasio.service';
import { ModificarClaveGimnasioDto } from '../dtos/modificar-clave-gimnasio.dto';
import { SincronizarUsuarioService } from '../../aplicacion/servicios/sincronizar-usuario.service'; // Se importa el nuevo servicio
import { RolUsuario } from '../../dominio/entidades/usuario.entity';

interface RequestConUsuario extends Request {
  user: { userId: string; email: string; nombre: string; rol: RolUsuario }; // 'nombre' se necesita para el sync
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(
    @Inject(PerfilUsuarioService)
    private readonly perfilUsuarioService: PerfilUsuarioService,
    @Inject(ObtenerClaveGimnasioService)
    private readonly obtenerClaveGimnasioService: ObtenerClaveGimnasioService,
    @Inject(ModificarClaveGimnasioService)
    private readonly modificarClaveGimnasioService: ModificarClaveGimnasioService,
    // Se inyecta el nuevo servicio de sincronización
    @Inject(SincronizarUsuarioService)
    private readonly sincronizarUsuarioService: SincronizarUsuarioService,
  ) {}

  /**
   * Endpoint para que el frontend sincronice el usuario de Cognito
   * con la base de datos local después del primer login.
   * POST /users/sync
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async sincronizarUsuario(@Req() req: RequestConUsuario) {
    const { userId, email, nombre, rol } = req.user;
    // La guardia ya validó el token. Simplemente pasamos los datos al servicio.
    return this.sincronizarUsuarioService.ejecutar({
      id: userId,
      email,
      nombre,
      rol,
    });
  }

  @Get('me')
  async obtenerMiPerfil(@Req() req: RequestConUsuario) {
    const usuarioId = req.user.userId;
    return this.perfilUsuarioService.ejecutar(usuarioId);
  }

  @Get('me/gym/key')
  @HttpCode(HttpStatus.OK)
  async obtenerMiClaveDeGimnasio(@Req() req: RequestConUsuario) {
    const { userId: solicitanteId, rol } = req.user;
    if (rol !== 'Entrenador' && rol !== 'Admin') {
      throw new ForbiddenException('Acción no permitida.');
    }
    return this.obtenerClaveGimnasioService.ejecutar(solicitanteId, rol);
  }

  @Patch('me/gym/key')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async modificarMiClaveDeGimnasio(
    @Req() req: RequestConUsuario,
    @Body() dto: ModificarClaveGimnasioDto,
  ) {
    const { userId: solicitanteId, rol } = req.user;
    if (rol !== 'Admin') {
      throw new ForbiddenException('Acción no permitida.');
    }
    return this.modificarClaveGimnasioService.ejecutar(solicitanteId, dto.nuevaClave);
  }
  
  @Get(':id')
  async obtenerPerfilPorId(
    @Req() req: RequestConUsuario,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.perfilUsuarioService.ejecutar(id);
  }
}
