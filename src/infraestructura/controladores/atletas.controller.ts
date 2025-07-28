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
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { AprobarAtletaService } from '../../aplicacion/servicios/aprobar-atleta.service';
import { AprobarAtletaDto } from '../dtos/aprobar-atleta.dto';
import { Request } from 'express';
import { UsuarioPayload } from '../estrategias/jwt.strategy';

interface RequestConUsuario extends Request {
  user: UsuarioPayload;
}

@Controller('atletas') // Ruta en español para consistencia
@UseGuards(JwtAuthGuard) // Guardia aplicada a todo el controlador
export class AtletasController {
  constructor(
    @Inject(AprobarAtletaService)
    private readonly aprobarAtletaService: AprobarAtletaService,
  ) {}

  /**
   * Endpoint protegido para que un entrenador apruebe a un nuevo atleta.
   * POST /atletas/:atletaId/aprobar
   */
  @Post(':atletaId/aprobar') // Ruta corregida
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async aprobarAtleta(
    @Req() req: RequestConUsuario,
    @Param('atletaId', ParseUUIDPipe) atletaId: string,
    @Body() aprobarAtletaDto: AprobarAtletaDto,
  ) {
    try {
      const { userId: coachId, rol } = req.user;

      // ✅ NUEVA LÓGICA: Permitir tanto Entrenador como Admin
      if (rol !== 'Entrenador' && rol !== 'Admin') {
        throw new ForbiddenException('No tienes permisos para realizar esta acción.');
      }

      return this.aprobarAtletaService.ejecutar(
        coachId,
        atletaId,
        aprobarAtletaDto,
      );
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado al aprobar al atleta.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }
}
