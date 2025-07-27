import {
  Inject,
  Injectable,
  UnprocessableEntityException,
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
    const token = jwt.sign({ email: usuarioGuardado.email }, secret, { expiresIn: '1h' });
    
    // Generar un token numérico de 6 dígitos para el usuario
    const tokenNumerico = Math.floor(100000 + Math.random() * 900000).toString();

    await this.emailService.sendConfirmationEmail(usuarioGuardado.email, tokenNumerico);


    return {
      id: usuarioGuardado.id,
      email: usuarioGuardado.email,
    };
  }
}
