import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  HttpException,
} from '@nestjs/common';
import { GestionGimnasiosService } from '../../aplicacion/servicios/gestion-gimnasios.service';
import { CrearGimnasioDto } from '../dtos/crear-gimnasio.dto';
import { ModificarGimnasioDto } from '../dtos/modificar-gimnasio.dto';

@Controller('gyms')
export class GestionGimnasiosController {
  constructor(
    private readonly gestionGimnasiosService: GestionGimnasiosService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async obtenerGimnasios(
    @Query('name') name?: string,
    @Query('size') size?: string,
    @Query('minBoxers') minBoxers?: string,
    @Query('maxBoxers') maxBoxers?: string,
    @Query('location') location?: string,
  ) {
    try {
      const filtros = {
        name,
        size,
        minBoxers: minBoxers ? parseInt(minBoxers) : undefined,
        maxBoxers: maxBoxers ? parseInt(maxBoxers) : undefined,
        location,
      };
      
      return await this.gestionGimnasiosService.obtenerGimnasios(filtros);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno al obtener gimnasios.';
      throw new HttpException({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async obtenerGimnasioPorId(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.gestionGimnasiosService.obtenerGimnasioPorId(id);
    } catch (error) {
      if (error.message === 'Gimnasio no encontrado') {
        throw new HttpException({ statusCode: HttpStatus.NOT_FOUND, message: 'Gimnasio no encontrado' }, HttpStatus.NOT_FOUND);
      }
      const message = error instanceof Error ? error.message : 'Error interno al obtener gimnasio.';
      throw new HttpException({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async crearGimnasio(@Body() crearGimnasioDto: CrearGimnasioDto) {
    try {
      return await this.gestionGimnasiosService.crearGimnasio(crearGimnasioDto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno al crear gimnasio.';
      throw new HttpException({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async modificarGimnasio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() modificarGimnasioDto: ModificarGimnasioDto,
  ) {
    try {
      return await this.gestionGimnasiosService.modificarGimnasio(id, modificarGimnasioDto);
    } catch (error) {
      if (error.message === 'Gimnasio no encontrado') {
        throw new HttpException({ statusCode: HttpStatus.NOT_FOUND, message: 'Gimnasio no encontrado' }, HttpStatus.NOT_FOUND);
      }
      const message = error instanceof Error ? error.message : 'Error interno al modificar gimnasio.';
      throw new HttpException({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async eliminarGimnasio(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return await this.gestionGimnasiosService.eliminarGimnasio(id);
    } catch (error) {
      if (error.message === 'Gimnasio no encontrado') {
        throw new HttpException({ statusCode: HttpStatus.NOT_FOUND, message: 'Gimnasio no encontrado' }, HttpStatus.NOT_FOUND);
      }
      if (error.message === 'No se puede eliminar el gimnasio porque tiene usuarios asociados') {
        throw new HttpException({ statusCode: HttpStatus.CONFLICT, message: 'No se puede eliminar el gimnasio porque tiene usuarios asociados' }, HttpStatus.CONFLICT);
      }
      const message = error instanceof Error ? error.message : 'Error interno al eliminar gimnasio.';
      throw new HttpException({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 