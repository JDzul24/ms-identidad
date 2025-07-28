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
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { AprobarAtletaService } from '../../aplicacion/servicios/aprobar-atleta.service';
import { AprobarAtletaDto } from '../dtos/aprobar-atleta.dto';
import { Request } from 'express';
import { UsuarioPayload } from '../estrategias/jwt.strategy';
import { ISolicitudRepositorio } from '../../dominio/repositorios/solicitud.repositorio';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';

interface RequestConUsuario extends Request {
  user: UsuarioPayload;
}

@Controller('atletas') // Ruta en español para consistencia
@UseGuards(JwtAuthGuard) // Guardia aplicada a todo el controlador
export class AtletasController {
  constructor(
    @Inject(AprobarAtletaService)
    private readonly aprobarAtletaService: AprobarAtletaService,
    @Inject('ISolicitudRepositorio')
    private readonly solicitudRepositorio: ISolicitudRepositorio,
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
  ) {}

  /**
   * Endpoint de prueba para verificar el estado del coach y las solicitudes
   * GET /atletas/debug/coach-status
   */
  @Get('debug/coach-status')
  @HttpCode(HttpStatus.OK)
  async debugCoachStatus(@Req() req: RequestConUsuario) {
    try {
      const { userId: coachId, rol } = req.user;

      // Obtener información del coach
      const coach = await this.usuarioRepositorio.encontrarPorId(coachId);
      
      // Obtener solicitudes pendientes del coach
      const solicitudesPendientes = await this.solicitudRepositorio.encontrarPendientesPorEntrenador(coachId);

      return {
        coach: {
          id: coach?.id,
          email: coach?.email,
          nombre: coach?.nombre,
          rol: coach?.rol,
          estadoAtleta: coach?.estadoAtleta,
          datosFisicosCapturados: coach?.datosFisicosCapturados,
        },
        solicitudesPendientes: solicitudesPendientes.map(s => ({
          id: s.id,
          atletaId: s.atletaId,
          coachId: s.coachId,
          status: s.status,
          nombreAtleta: s.nombreAtleta,
          emailAtleta: s.emailAtleta,
        })),
        totalSolicitudes: solicitudesPendientes.length,
      };
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'Error al obtener información del coach.';
      throw new HttpException({ statusCode: status, message }, status);
    }
  }

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
