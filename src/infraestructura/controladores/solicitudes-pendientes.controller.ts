import {
  Controller,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { ConsultarSolicitudesPendientesService } from '../../aplicacion/servicios/consultar-solicitudes-pendientes.service';
import { AtletaPendienteDto } from '../dtos/solicitudes-pendientes.dto';

interface RequestConUsuario extends Request {
  user: {
    userId: string;
    email: string;
    rol: string;
  };
}

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class SolicitudesPendientesController {
  constructor(
    @Inject(ConsultarSolicitudesPendientesService)
    private readonly consultarSolicitudesPendientesService: ConsultarSolicitudesPendientesService,
  ) {}

  @Get('pending')
  @HttpCode(HttpStatus.OK)
  async obtenerSolicitudesPendientes(@Req() req: RequestConUsuario): Promise<AtletaPendienteDto[]> {
    const { userId } = req.user;

    return this.consultarSolicitudesPendientesService.ejecutar(userId);
  }
} 