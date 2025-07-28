import {
  Inject,
  Injectable,
  UnprocessableEntityException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { RegistrarUsuarioDto } from '../../infraestructura/dtos/registrar-usuario.dto';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { Usuario } from '../../dominio/entidades/usuario.entity';
import { Gimnasio } from '../../dominio/entidades/gimnasio.entity';
import { EmailService } from './email.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RegistroUsuarioService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  public async ejecutar(dto: RegistrarUsuarioDto): Promise<{ id: string; email: string; gymnarium?: { id: string; nombre: string } }> {
    console.log('🚀 REGISTRO: Iniciando registro para:', dto.email);
    console.log('📋 REGISTRO: Datos recibidos:', { email: dto.email, rol: dto.rol, nombre: dto.nombre });

    // Validar que el usuario no exista
    const usuarioExistente = await this.usuarioRepositorio.encontrarPorEmail(dto.email);
    if (usuarioExistente) {
      console.log('❌ REGISTRO: Usuario ya existe:', dto.email);
      throw new ConflictException('El usuario ya existe');
    }

    // Generar token numérico de 6 dígitos para confirmación
    const tokenNumerico = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // El token expira en 15 minutos

    // ✅ CORRECCIÓN: Lógica específica para ADMINS
    if (dto.rol === 'Admin') {
      console.log('👑 REGISTRO: Creando ADMIN activo:', dto.email);
      
      // Crear admin con estado activo automáticamente
      const usuario = await Usuario.crear({
        email: dto.email,
        nombre: dto.nombre,
        passwordPlano: dto.password,
        rol: dto.rol,
      });

      const usuarioGuardado = await this.usuarioRepositorio.guardar(usuario);
      console.log('✅ REGISTRO: Admin creado activo:', dto.email);

      // Establecer token de confirmación
      await this.usuarioRepositorio.establecerTokenDeConfirmacion(
        usuarioGuardado.id,
        tokenNumerico,
        expiresAt
      );

      // Crear gimnasio automáticamente para admin
      const nombreGimnasio = dto.nombreGimnasio || `Gimnasio de ${dto.nombre}`;
      const claveGimnasio = this.generarClaveGimnasio(nombreGimnasio);
      
      const gimnasio = Gimnasio.crear({
        ownerId: usuarioGuardado.id,
        nombre: nombreGimnasio,
        tamaño: 'mediano',
        totalBoxeadores: 0,
        ubicacion: 'Por definir',
        imagenUrl: null,
        gymKey: claveGimnasio,
      });

      const gimnasioGuardado = await this.gimnasioRepositorio.guardar(gimnasio);
      console.log('✅ REGISTRO: Gimnasio creado para admin:', gimnasioGuardado.nombre);
      console.log('🔑 REGISTRO: Clave del gimnasio:', claveGimnasio);

      // Enviar email de confirmación
      try {
        await this.emailService.sendConfirmationEmail(dto.email, tokenNumerico);
        console.log('✅ REGISTRO: Email de confirmación enviado a admin:', dto.email);
      } catch (error) {
        console.error('❌ REGISTRO: Error enviando email a admin:', error);
        // No fallar el registro si el email falla
      }

      return {
        id: usuarioGuardado.id,
        email: usuarioGuardado.email,
        gymnarium: {
          id: gimnasioGuardado.id,
          nombre: gimnasioGuardado.nombre,
        }
      };
    }

    // ✅ Lógica para COACHES y ATLETAS (necesitan clave de gym)
    console.log('👤 REGISTRO: Creando usuario que necesita clave de gym:', dto.email);
    
    const usuario = await Usuario.crear({
      email: dto.email,
      nombre: dto.nombre,
      passwordPlano: dto.password,
      rol: dto.rol,
    });

    const usuarioGuardado = await this.usuarioRepositorio.guardar(usuario);
    console.log('✅ REGISTRO: Usuario creado pendiente (necesita clave gym):', dto.email);

    // Establecer token de confirmación
    await this.usuarioRepositorio.establecerTokenDeConfirmacion(
      usuarioGuardado.id,
      tokenNumerico,
      expiresAt
    );

    // Enviar email de confirmación
    try {
      await this.emailService.sendConfirmationEmail(dto.email, tokenNumerico);
      console.log('✅ REGISTRO: Email de confirmación enviado:', dto.email);
    } catch (error) {
      console.error('❌ REGISTRO: Error enviando email:', error);
      // No fallar el registro si el email falla
    }

    return {
      id: usuarioGuardado.id,
      email: usuarioGuardado.email,
    };
  }

  // ✅ FUNCIÓN AUXILIAR para generar clave de gimnasio
  private generarClaveGimnasio(nombreGimnasio: string): string {
    const nombreLimpio = nombreGimnasio.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const timestamp = Date.now().toString().slice(-3);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${nombreLimpio.slice(0, 3)}${timestamp}${random}`;
  }
}
