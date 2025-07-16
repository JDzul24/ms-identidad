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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../infraestructura/guardias/jwt-auth.guard';
import { Request } from 'express';
import { ConsultarMiembrosService } from '../../aplicacion/servicios/consultar-miembros.service';

/**
 * Interfaz para extender el objeto Request de Express y añadir la propiedad 'user',
 * que es adjuntada por la estrategia de Passport después de validar un token JWT.
 */
interface RequestConUsuario extends Request {
  user: {
    userId: string;
    rol: string;
    email: string;
  };
}

@Controller('gyms')
export class GimnasiosController {
  constructor(
    @Inject(ConsultarMiembrosService)
    private readonly consultarMiembrosService: ConsultarMiembrosService,
  ) {}

  /**
   * Endpoint protegido para obtener la lista de todos los miembros
   * (atletas y entrenadores) de un gimnasio específico.
   * GET /gyms/:gymId/members
   *
   * @param req - El objeto de la petición, enriquecido con los datos del usuario.
   * @param gymId - El ID del gimnasio, extraído de la URL y validado como UUID.
   * @returns Un arreglo de objetos MiembroGimnasioDto.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':gymId/members')
  async obtenerMiembrosDeGimnasio(
    @Req() req: RequestConUsuario,
    @Param('gymId', ParseUUIDPipe) gymId: string,
  ) {
    try {
      const { userId: solicitanteId, rol } = req.user;

      // 1. Lógica de Autorización a nivel de Rol.
      //    Solo los roles 'Entrenador' y 'Admin' pueden realizar esta acción.
      if (rol !== 'Entrenador' && rol !== 'Admin') {
        throw new ForbiddenException(
          'No tienes los permisos necesarios para realizar esta acción.',
        );
      }

      // 2. Delegar la ejecución y la lógica de negocio más fina al servicio de aplicación.
      //    El servicio se encargará de verificar si el solicitante pertenece al gimnasio.
      return await this.consultarMiembrosService.ejecutar(solicitanteId, gymId);
    } catch (error) {
      // Captura y re-lanza los errores de negocio (como ForbiddenException)
      // o errores inesperados con un formato de respuesta HTTP estandarizado.
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
