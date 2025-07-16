import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  ParseUUIDPipe,
  ForbiddenException,
  Inject,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../infraestructura/guardias/jwt-auth.guard';
import { AprobarAtletaService } from '../../aplicacion/servicios/aprobar-atleta.service';
import { AprobarAtletaDto } from '../dtos/aprobar-atleta.dto';
import { Request } from 'express';

interface RequestConUsuario extends Request {
  user: { userId: string; rol: string };
}

@Controller('athletes')
export class AtletasController {
  constructor(
    @Inject(AprobarAtletaService)
    private readonly aprobarAtletaService: AprobarAtletaService,
  ) {}

  /**
   * Endpoint protegido para que un entrenador apruebe a un nuevo atleta.
   * POST /athletes/:atletaId/approve
   */
  @UseGuards(JwtAuthGuard)
  @Post(':atletaId/approve')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async aprobarAtleta(
    @Req() req: RequestConUsuario,
    @Param('atletaId', ParseUUIDPipe) atletaId: string,
    @Body() aprobarAtletaDto: AprobarAtletaDto,
  ) {
    const { userId: coachId, rol } = req.user;

    // Lógica de autorización a nivel de controlador
    if (rol !== 'Entrenador') {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    return this.aprobarAtletaService.ejecutar(coachId, atletaId, aprobarAtletaDto);
  }
}