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
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { Request } from 'express';
import { ConsultarMiembrosService } from '../../aplicacion/servicios/consultar-miembros.service';
import { VincularGimnasioService } from '../../aplicacion/servicios/vincular-gimnasio.service';
import { VincularGimnasioDto } from '../dtos/vincular-gimnasio.dto';
import { UsuarioPayload } from '../estrategias/jwt.strategy';

// Se usa la interfaz importada para seguridad de tipos.
interface RequestConUsuario extends Request {
  user: UsuarioPayload;
}

@Controller('gimnasios') // Ruta en español para consistencia
@UseGuards(JwtAuthGuard) // ¡CORRECTO! Guardia aplicada a todo el controlador.
export class GimnasiosController {
  constructor(
    @Inject(ConsultarMiembrosService)
    private readonly consultarMiembrosService: ConsultarMiembrosService,
    @Inject(VincularGimnasioService)
    private readonly vincularGimnasioService: VincularGimnasioService,
  ) {}

  @Post('vincular') // Ruta corregida a 'vincular'
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async vincularAGimnasio(
    @Req() req: RequestConUsuario,
    @Body() vincularGimnasioDto: VincularGimnasioDto,
  ) {
    try {
      // ¡CORREGIDO! El userId se obtiene del token seguro, no del body.
      const { userId } = req.user;
      const { claveGym } = vincularGimnasioDto; // DTO corregido: Usar claveGym
      return await this.vincularGimnasioService.ejecutar(userId, claveGym);
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado al vincular la cuenta.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }

  @Get(':gymId/miembros') // Ruta corregida a 'miembros'
  @HttpCode(HttpStatus.OK)
  async obtenerMiembrosDeGimnasio(
    @Req() req: RequestConUsuario,
    @Param('gymId', ParseUUIDPipe) gymId: string,
  ) {
    try {
      const { userId: solicitanteId, rol } = req.user;
      // ¡CORRECTO! Validación de rol explícita como doble capa de seguridad.
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
