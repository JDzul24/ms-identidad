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

    // 4. Generar token de confirmación y enviar correo.
    const secret = this.configService.get<string>('EMAIL_CONFIRMATION_SECRET');
    if (!secret) {
      // Esta es la causa más probable del error 500.
      throw new InternalServerErrorException(
        'Error del servidor: La clave para la confirmación por correo no está configurada.',
      );
    }

    const token = jwt.sign({ email: usuarioGuardado.email }, secret, {
      expiresIn: '1h',
    });

    // Se corrige el error: se debe enviar el token JWT, no uno numérico.
    await this.emailService.sendConfirmationEmail(usuarioGuardado.email, token);

    return {
      id: usuarioGuardado.id,
      email: usuarioGuardado.email,
    };
  }
}
