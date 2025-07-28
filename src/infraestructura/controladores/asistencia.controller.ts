import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
  UsePipes,
  ValidationPipe,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { ConsultarAsistenciaService } from '../../aplicacion/servicios/consultar-asistencia.service';
import { ActualizarAsistenciaService } from '../../aplicacion/servicios/actualizar-asistencia.service';
import { AsistenciaMasivaDto, ActualizarAsistenciaDto } from '../dtos/asistencia.dto';

interface RequestConUsuario extends Request {
  user: {
    userId: string;
    email: string;
    rol: string;
  };
}

@Controller('asistencia')
@UseGuards(JwtAuthGuard)
export class AsistenciaController {
  constructor(
    @Inject(ConsultarAsistenciaService)
    private readonly consultarAsistenciaService: ConsultarAsistenciaService,
    @Inject(ActualizarAsistenciaService)
    private readonly actualizarAsistenciaService: ActualizarAsistenciaService,
  ) {}

  @Get(':gymId/:fecha')
  @HttpCode(HttpStatus.OK)
  async obtenerAsistencia(
    @Param('gymId') gymId: string,
    @Param('fecha') fecha: string,
    @Req() req: RequestConUsuario,
  ) {
    const { userId, rol } = req.user;

    // Solo Admin y Entrenador pueden ver asistencia
    if (!['Admin', 'Entrenador'].includes(rol)) {
      throw new ForbiddenException('No tienes permisos para ver la asistencia.');
    }

    return this.consultarAsistenciaService.ejecutar(gymId, fecha, userId);
  }

  @Post(':gymId/:fecha')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async actualizarAsistencia(
    @Param('gymId') gymId: string,
    @Param('fecha') fecha: string,
    @Body() dto: AsistenciaMasivaDto,
    @Req() req: RequestConUsuario,
  ) {
    const { userId, rol } = req.user;

    // Solo Admin y Entrenador pueden actualizar asistencia
    if (!['Admin', 'Entrenador'].includes(rol)) {
      throw new ForbiddenException('No tienes permisos para actualizar la asistencia.');
    }

    return this.actualizarAsistenciaService.ejecutar(gymId, fecha, dto, userId);
  }

  @Patch(':gymId/:fecha/:alumnoId')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async actualizarAsistenciaIndividual(
    @Param('gymId') gymId: string,
    @Param('fecha') fecha: string,
    @Param('alumnoId') alumnoId: string,
    @Body() dto: ActualizarAsistenciaDto,
    @Req() req: RequestConUsuario,
  ) {
    const { userId, rol } = req.user;

    // Solo Admin y Entrenador pueden actualizar asistencia
    if (!['Admin', 'Entrenador'].includes(rol)) {
      throw new ForbiddenException('No tienes permisos para actualizar la asistencia.');
    }

    // Crear DTO para asistencia individual
    const asistenciaIndividualDto: AsistenciaMasivaDto = {
      fecha,
      asistencias: [
        {
          alumno_id: alumnoId,
          status: dto.status,
        },
      ],
    };

    return this.actualizarAsistenciaService.ejecutar(gymId, fecha, asistenciaIndividualDto, userId);
  }
} 