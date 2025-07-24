import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
  Inject,
  ForbiddenException,
  HttpException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { Request } from 'express';
import { ConsultarMiembrosService } from '../../aplicacion/servicios/consultar-miembros.service';
import { ObtenerClaveGimnasioService } from '../../aplicacion/servicios/obtener-clave-gimnasio.service';

interface RequestConUsuario extends Request {
  user: { userId: string; rol: string };
}

@Controller('gyms')
@UseGuards(JwtAuthGuard) // Protegemos todas las rutas de este controlador
export class GimnasiosController {
  constructor(
    @Inject(ConsultarMiembrosService)
    private readonly consultarMiembrosService: ConsultarMiembrosService,
    @Inject(ObtenerClaveGimnasioService)
    private readonly obtenerClaveGimnasioService: ObtenerClaveGimnasioService,
  ) {}

  /**
   * Endpoint protegido para que un entrenador obtenga la clave de registro de su gimnasio.
   * GET /gyms/my/key
   */
  @Get('my/key')
  @HttpCode(HttpStatus.OK)
  async obtenerMiClaveDeGimnasio(@Req() req: RequestConUsuario) {
    try {
      const { userId: solicitanteId, rol } = req.user;

      // Autorización a nivel de Rol: Solo los entrenadores pueden solicitar la clave.
      if (rol !== 'Entrenador') {
        throw new ForbiddenException(
          'Solo los entrenadores pueden obtener la clave del gimnasio.',
        );
      }

      return await this.obtenerClaveGimnasioService.ejecutar(solicitanteId);
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado al obtener la clave del gimnasio.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }

  @Get(':gymId/members')
  @HttpCode(HttpStatus.OK)
  async obtenerMiembrosDeGimnasio(
    @Req() req: RequestConUsuario,
    @Param('gymId', ParseUUIDPipe) gymId: string,
  ) {
    try {
      const { userId: solicitanteId, rol } = req.user;

      if (rol !== 'Entrenador' && rol !== 'Admin') {
        throw new ForbiddenException(
          'No tienes los permisos necesarios para ver los miembros del gimnasio.',
        );
      }
      
      return await this.consultarMiembrosService.ejecutar(solicitanteId, gymId);
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error interno al consultar los miembros del gimnasio.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }
}
