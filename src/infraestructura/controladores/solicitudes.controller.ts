import { Controller, Get, Inject, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../infraestructura/guardias/jwt-auth.guard';
import { ConsultarSolicitudesService } from '../../aplicacion/servicios/consultar-solicitudes.service';
import { Request } from 'express';

interface RequestConUsuario extends Request {
  user: {
    userId: string;
    email: string;
    rol: string;
  };
}

@Controller('requests')
export class SolicitudesController {
  constructor(
    @Inject(ConsultarSolicitudesService)
    private readonly consultarSolicitudesService: ConsultarSolicitudesService,
  ) {}

  /**
   * Endpoint protegido para que un entrenador obtenga sus solicitudes pendientes.
   * GET /requests/pending
   */
  @UseGuards(JwtAuthGuard)
  @Get('pending')
  async obtenerSolicitudesPendientes(@Req() req: RequestConUsuario) {
    const { userId, rol } = req.user;

    // Lógica de autorización: solo los entrenadores pueden acceder.
    if (rol !== 'Entrenador') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    return this.consultarSolicitudesService.ejecutar(userId);
  }
}
