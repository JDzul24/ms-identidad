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
  Post, // Se añade Post
  Body, // Se añade Body
  UsePipes, // Se añade UsePipes
  ValidationPipe, // Se añade ValidationPipe
} from '@nestjs/common';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { Request } from 'express';
import { ConsultarMiembrosService } from '../../aplicacion/servicios/consultar-miembros.service';
import { ObtenerClaveGimnasioService } from '../../aplicacion/servicios/obtener-clave-gimnasio.service';
import { VincularGimnasioService } from '../../aplicacion/servicios/vincular-gimnasio.service'; // Se importa el nuevo servicio
import { VincularGimnasioDto } from '../dtos/vincular-gimnasio.dto'; // Se importa el nuevo DTO

interface RequestConUsuario extends Request {
  user: { userId: string; rol: string };
}

@Controller('gyms')
@UseGuards(JwtAuthGuard)
export class GimnasiosController {
  constructor(
    @Inject(ConsultarMiembrosService)
    private readonly consultarMiembrosService: ConsultarMiembrosService,
    @Inject(ObtenerClaveGimnasioService)
    private readonly obtenerClaveGimnasioService: ObtenerClaveGimnasioService,
    // Se inyecta el nuevo servicio de vinculación
    @Inject(VincularGimnasioService)
    private readonly vincularGimnasioService: VincularGimnasioService,
  ) {}

  /**
   * Endpoint protegido para que un usuario autenticado vincule su cuenta a un gimnasio.
   * POST /gyms/link
   */
  @Post('link')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async vincularAGimnasio(
    @Req() req: RequestConUsuario,
    @Body() vincularGimnasioDto: VincularGimnasioDto,
  ) {
    try {
      const { userId } = req.user;
      const { claveGym } = vincularGimnasioDto;

      // La lógica de negocio, incluyendo la creación de la solicitud si aplica,
      // se delega completamente al servicio de aplicación.
      return await this.vincularGimnasioService.ejecutar(userId, claveGym);
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error instanceof Error ? error.message : 'Ocurrió un error inesperado al vincular la cuenta.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }

  @Get('my/key')
  @HttpCode(HttpStatus.OK)
  async obtenerMiClaveDeGimnasio(@Req() req: RequestConUsuario) {
    try {
      const { userId: solicitanteId, rol } = req.user;

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
