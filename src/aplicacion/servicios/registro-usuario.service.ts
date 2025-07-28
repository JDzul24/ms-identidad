import {
  Inject,
  Injectable,
  UnprocessableEntityException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { RegistrarUsuarioDto } from '../../infraestructura/dtos/registrar-usuario.dto';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { Usuario } from '../../dominio/entidades/usuario.entity';
import { Gimnasio } from '../../dominio/entidades/gimnasio.entity';
import { EmailService } from './email.service';

@Injectable()
export class RegistroUsuarioService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  public async ejecutar(
    dto: RegistrarUsuarioDto,
  ): Promise<{ id: string; email: string; gymnarium?: { id: string; nombre: string } }> {
    // --- NUEVA VALIDACIÓN ---
    // Asegurarnos de que los datos esenciales llegaron correctamente.
    if (!dto || !dto.email || !dto.password || !dto.nombre || !dto.rol) {
      throw new BadRequestException('Datos de registro incompletos. Por favor, verifica que todos los campos requeridos (email, password, nombre, rol) se están enviando correctamente.');
    }

    // 1. Validar que el email no esté ya en uso.
    const usuarioExistente = await this.usuarioRepositorio.encontrarPorEmail(
      dto.email,
    );
    if (usuarioExistente) {
      throw new UnprocessableEntityException(
        'El correo electrónico ya está en uso.',
      );
    }

    // 2. Crear la entidad de dominio Usuario.
    const nuevoUsuario = await Usuario.crear({
      email: dto.email,
      passwordPlano: dto.password,
      nombre: dto.nombre,
      rol: dto.rol,
    });

    // 3. Persistir el nuevo usuario en la base de datos.
    const usuarioGuardado = await this.usuarioRepositorio.guardar(nuevoUsuario);

    // 4. Si es Admin, crear gimnasio y vincularlo
    let gimnasioCreado = null;
    if (dto.rol === 'Admin') {
      const nombreGimnasio = dto.nombreGimnasio || `Gimnasio de ${dto.nombre}`;
      
      const gimnasio = Gimnasio.crear({
        ownerId: usuarioGuardado.id,
        nombre: nombreGimnasio,
        tamaño: 'mediano',
        totalBoxeadores: 0,
        ubicacion: 'Por definir',
        imagenUrl: null,
        gymKey: this.generarClaveGimnasio(nombreGimnasio),
      });

      const gimnasioGuardado = await this.gimnasioRepositorio.guardar(gimnasio);
      
      gimnasioCreado = {
        id: gimnasioGuardado.id,
        nombre: gimnasioGuardado.nombre,
      };
    }

    // 5. Generar token numérico, guardarlo y enviarlo por correo.
    const tokenNumerico = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // El token expira en 15 minutos

    await this.usuarioRepositorio.establecerTokenDeConfirmacion(
      usuarioGuardado.id,
      tokenNumerico,
      expiresAt,
    );

    await this.emailService.sendConfirmationEmail(
      usuarioGuardado.email,
      tokenNumerico,
    );

    return {
      id: usuarioGuardado.id,
      email: usuarioGuardado.email,
      gymnarium: gimnasioCreado,
    };
  }

  private generarClaveGimnasio(nombreGimnasio: string): string {
    // Generar clave basada en el nombre del gimnasio
    const nombreLimpio = nombreGimnasio.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const timestamp = Date.now().toString().slice(-3);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    return `${nombreLimpio.slice(0, 3)}${timestamp}${random}`;
  }
}
