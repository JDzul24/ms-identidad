import { Inject, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';

@Injectable()
export class ConfirmacionEmailService {
  constructor(
    @Inject('IUsuarioRepositorio') private readonly usuarioRepositorio: IUsuarioRepositorio,
    private readonly configService: ConfigService,
  ) {}

  async confirmarEmail(token: string): Promise<{ message: string }> {
    try {
      const secret = this.configService.get<string>('EMAIL_CONFIRMATION_SECRET');
      if (!secret) {
        throw new Error('EMAIL_CONFIRMATION_SECRET is not configured.');
      }

      const payload = jwt.verify(token, secret) as { email: string };
      const email = payload.email;

      const usuario = await this.usuarioRepositorio.encontrarPorEmail(email);

      if (!usuario) {
        throw new UnprocessableEntityException('Usuario no encontrado.');
      }

      if (usuario.estaVerificado()) {
        return { message: 'Este correo electrónico ya ha sido verificado.' };
      }

      await this.usuarioRepositorio.marcarComoVerificado(usuario.id);

      return { message: 'Correo electrónico verificado con éxito. Ya puedes iniciar sesión.' };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Token de confirmación inválido o expirado.');
      }
      throw error;
    }
  }
} 