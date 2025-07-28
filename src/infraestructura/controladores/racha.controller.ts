import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { ConsultarRachaService } from '../../aplicacion/servicios/consultar-racha.service';
import { RachaDto, HistorialRachaDto } from '../dtos/racha.dto';

interface RequestConUsuario extends Request {
  user: {
    userId: string;
    email: string;
    rol: string;
  };
}

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class RachaController {
  constructor(
    @Inject(ConsultarRachaService)
    private readonly consultarRachaService: ConsultarRachaService,
  ) {}

  @Get(':userId/racha')
  @HttpCode(HttpStatus.OK)
  async obtenerRacha(
    @Param('userId') userId: string,
    @Req() req: RequestConUsuario,
  ): Promise<RachaDto> {
    const { userId: solicitanteId } = req.user;

    return this.consultarRachaService.ejecutar(userId, solicitanteId);
  }

  @Get(':userId/racha/historial')
  @HttpCode(HttpStatus.OK)
  async obtenerHistorialRacha(
    @Param('userId') userId: string,
    @Req() req: RequestConUsuario,
  ): Promise<HistorialRachaDto> {
    const { userId: solicitanteId } = req.user;

    // Por ahora, devolvemos un historial básico
    // TODO: Implementar servicio completo de historial
    return {
      usuario_id: userId,
      record_personal: 0,
      racha_actual: 0,
      rachas_anteriores: [],
    };
  }
} 