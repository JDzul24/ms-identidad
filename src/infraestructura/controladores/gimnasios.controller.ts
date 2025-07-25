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
  Patch, // Se añade Patch
  Body,  // Se añade Body
  UsePipes, // Se añade UsePipes
  ValidationPipe, // Se añade ValidationPipe
} from '@nestjs/common';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { Request } from 'express';
import { ConsultarMiembrosService } from '../../aplicacion/servicios/consultar-miembros.service';
import { ObtenerClaveGimnasioService } from '../../aplicacion/servicios/obtener-clave-gimnasio.service';
import { ModificarClaveGimnasioService } from '../../aplicacion/servicios/modificar-clave-gimnasio.service'; // Se importa el nuevo servicio
import { ModificarClaveGimnasioDto } from '../dtos/modificar-clave-gimnasio.dto'; // Se importa el nuevo DTO

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
    // Se inyecta el nuevo servicio de modificación
    @Inject(ModificarClaveGimnasioService)
    private readonly modificarClaveGimnasioService: ModificarClaveGimnasioService,
  ) {}

  @Get('my/key')
  @HttpCode(HttpStatus.OK)
  async obtenerMiClaveDeGimnasio(@Req() req: RequestConUsuario) {
    try {
      const { userId: solicitanteId, rol } = req.user;

      if (rol !== 'Entrenador' && rol !== 'Admin') {
        throw new ForbiddenException(
          'Solo los entrenadores o administradores pueden obtener la clave del gimnasio.',
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

  /**
   * Endpoint protegido para que un administrador modifique la clave de registro de su gimnasio.
   * PATCH /gyms/my/key
   */
  @Patch('my/key')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async modificarMiClaveDeGimnasio(
    @Req() req: RequestConUsuario,
    @Body() modificarClaveDto: ModificarClaveGimnasioDto,
  ) {
    try {
      const { userId: solicitanteId, rol } = req.user;

      // Autorización a nivel de Rol: Solo los administradores pueden modificar la clave.
      if (rol !== 'Admin') {
        throw new ForbiddenException(
          'No tienes los permisos necesarios para modificar la clave del gimnasio.',
        );
      }
      
      return await this.modificarClaveGimnasioService.ejecutar(solicitanteId, modificarClaveDto.nuevaClave);
    } catch (error) {
        const status =
            error instanceof HttpException
            ? error.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        const message =
            error instanceof Error ? error.message : 'Ocurrió un error inesperado al modificar la clave.';
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
