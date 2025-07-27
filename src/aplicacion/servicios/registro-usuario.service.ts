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
import { Usuario } from '../../dominio/entidades/usuario.entity';
import { EmailService } from './email.service';

@Injectable()
export class RegistroUsuarioService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  public async ejecutar(
    dto: RegistrarUsuarioDto,
  ): Promise<{ id: string; email: string }> {
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

    // 4. Generar token numérico, guardarlo y enviarlo por correo.
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
    };
  }
}
