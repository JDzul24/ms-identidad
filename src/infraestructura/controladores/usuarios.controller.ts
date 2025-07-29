import {
  Controller,
  Get,
  Inject,
  Req,
  UseGuards,
  ForbiddenException,
  Patch,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  HttpException,
  Post,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { PerfilUsuarioService } from '../../aplicacion/servicios/perfil-usuario.service';
import { Request } from 'express';
import { ObtenerClaveGimnasioService } from '../../aplicacion/servicios/obtener-clave-gimnasio.service';
import { ModificarClaveGimnasioService } from '../../aplicacion/servicios/modificar-clave-gimnasio.service';
import { ModificarClaveGimnasioDto } from '../dtos/modificar-clave-gimnasio.dto';
import { SincronizarUsuarioService } from '../../aplicacion/servicios/sincronizar-usuario.service';
import { UsuarioPayload } from '../estrategias/jwt.strategy';
import { RolUsuario } from '../../dominio/entidades/usuario.entity';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { ActivarCoachesService } from '../../aplicacion/servicios/activar-coaches.service';

interface RequestConUsuario extends Request {
  user: UsuarioPayload & { nombre: string };
}

@Controller('usuarios') // Ruta estandarizada a 'usuarios'
@UseGuards(JwtAuthGuard) // Guardia aplicada a todo el controlador
export class UsuariosController {
  constructor(
    @Inject(PerfilUsuarioService)
    private readonly perfilUsuarioService: PerfilUsuarioService,
    @Inject(ObtenerClaveGimnasioService)
    private readonly obtenerClaveGimnasioService: ObtenerClaveGimnasioService,
    @Inject(ModificarClaveGimnasioService)
    private readonly modificarClaveGimnasioService: ModificarClaveGimnasioService,
    @Inject(SincronizarUsuarioService)
    private readonly sincronizarUsuarioService: SincronizarUsuarioService,
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    @Inject(ActivarCoachesService)
    private readonly activarCoachesService: ActivarCoachesService,
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async obtenerMiPerfil(@Req() req: RequestConUsuario) {
    try {
      const { userId } = req.user;
      return this.perfilUsuarioService.ejecutar(userId);
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'Error al obtener el perfil.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }

  @Get('gimnasio/clave')
  @HttpCode(HttpStatus.OK)
  async obtenerMiClaveDeGimnasio(@Req() req: RequestConUsuario) {
    try {
      const { userId, rol } = req.user;
      if (rol !== 'Entrenador' && rol !== 'Admin') {
        throw new ForbiddenException('No tienes permisos para ver la clave del gimnasio.');
      }
      return this.obtenerClaveGimnasioService.ejecutar(userId, rol as RolUsuario);
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'Error al obtener la clave.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }

  @Patch('gimnasio/clave')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async modificarMiClaveDeGimnasio(
    @Req() req: RequestConUsuario,
    @Body() dto: ModificarClaveGimnasioDto,
  ) {
    try {
      const { userId, rol } = req.user;
      if (rol !== 'Admin') {
        throw new ForbiddenException('Solo los administradores pueden cambiar la clave del gimnasio.');
      }
      return this.modificarClaveGimnasioService.ejecutar(userId, dto.nuevaClave);
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'Error al modificar la clave.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }

  // ✅ ENDPOINT TEMPORAL PARA ACTIVAR COACHES EXISTENTES
  @Post('fix-coaches-estado')
  @HttpCode(HttpStatus.OK)
  async activarCoachesExistentes(@Req() req: RequestConUsuario) {
    try {
      const { userId, rol } = req.user;
      
      // ✅ CORRECCIÓN: Permitir tanto Admin como Entrenador
      if (rol !== 'Admin' && rol !== 'Entrenador') {
        throw new ForbiddenException('Solo los administradores y entrenadores pueden ejecutar este fix.');
      }

      // Ejecutar el fix usando el servicio
      const resultado = await this.activarCoachesService.ejecutar();
      
      return {
        message: 'Coaches activados exitosamente',
        coachesActivados: resultado.coachesActivados,
        coachesYaActivos: resultado.coachesYaActivos
      };
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'Error al activar coaches.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }
  
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async sincronizarUsuario(@Req() req: RequestConUsuario) {
    try {
      const { userId, email, nombre, rol } = req.user;
      return this.sincronizarUsuarioService.ejecutar({
        id: userId,
        email,
        nombre,
        rol: rol as RolUsuario,
      });
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'Error al sincronizar el usuario.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }
}
