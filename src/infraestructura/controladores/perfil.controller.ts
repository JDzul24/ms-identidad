import {
  Controller,
  Get,
  Patch,
  Req,
  Body,
  UseGuards,
  Inject,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guardias/jwt-auth.guard';
import { Request } from 'express';
import { ObtenerClaveGimnasioService } from '../../aplicacion/servicios/obtener-clave-gimnasio.service';
import { ModificarClaveGimnasioService } from '../../aplicacion/servicios/modificar-clave-gimnasio.service';
import { ModificarClaveGimnasioDto } from '../dtos/modificar-clave-gimnasio.dto';

interface RequestConUsuario extends Request {
  user: { userId: string; rol: string };
}

@Controller('profile') // Nueva ruta base: /v1/users/profile
@UseGuards(JwtAuthGuard)
export class PerfilController {
  constructor(
    @Inject(ObtenerClaveGimnasioService)
    private readonly obtenerClaveGimnasioService: ObtenerClaveGimnasioService,
    @Inject(ModificarClaveGimnasioService)
    private readonly modificarClaveGimnasioService: ModificarClaveGimnasioService,
  ) {}

  @Get('gym/key') // Endpoint completo: GET /v1/users/profile/gym/key
  @HttpCode(HttpStatus.OK)
  async obtenerMiClaveDeGimnasio(@Req() req: RequestConUsuario) {
    const { userId: solicitanteId, rol } = req.user;
    if (rol !== 'Entrenador' && rol !== 'Admin') {
      throw new ForbiddenException('Acción no permitida para este rol.');
    }
    return this.obtenerClaveGimnasioService.ejecutar(solicitanteId, rol);
  }

  @Patch('gym/key') // Endpoint completo: PATCH /v1/users/profile/gym/key
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async modificarMiClaveDeGimnasio(
    @Req() req: RequestConUsuario,
    @Body() dto: ModificarClaveGimnasioDto,
  ) {
    const { userId: solicitanteId, rol } = req.user;
    if (rol !== 'Admin') {
      throw new ForbiddenException('Acción no permitida para este rol.');
    }
    return this.modificarClaveGimnasioService.ejecutar(solicitanteId, dto.nuevaClave);
  }
}
