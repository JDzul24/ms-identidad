import { Controller, Get, Inject, Req, UseGuards, ForbiddenException, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { ConsultarSolicitudesService } from '../../aplicacion/servicios/consultar-solicitudes.service';
import { Request } from 'express';
import { UsuarioPayload } from '../estrategias/jwt.strategy';

interface RequestConUsuario extends Request {
  user: UsuarioPayload;
}

@Controller('solicitudes') // Ruta en español para consistencia
@UseGuards(JwtAuthGuard) // Guardia aplicada a todo el controlador
export class SolicitudesController {
  constructor(
    @Inject(ConsultarSolicitudesService)
    private readonly consultarSolicitudesService: ConsultarSolicitudesService,
  ) {}

  /**
   * Endpoint protegido para que un entrenador obtenga sus solicitudes pendientes.
   * GET /solicitudes/pendientes
   */
  @Get('pendientes')
  @HttpCode(HttpStatus.OK)
  async obtenerSolicitudesPendientes(@Req() req: RequestConUsuario) {
    try {
      const { userId, rol } = req.user;

      // ✅ VALIDACIÓN SIMPLIFICADA: Solo verificar que sea coach o admin
      if (rol !== 'Entrenador' && rol !== 'Admin') {
        throw new ForbiddenException('Solo coaches y admins pueden ver solicitudes pendientes.');
      }

      // ✅ NO validar estadoAtleta del coach

      return this.consultarSolicitudesService.ejecutar(userId);
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado al consultar las solicitudes.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }
}
