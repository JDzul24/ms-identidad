import { Inject, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';

@Injectable()
export class ConfirmacionEmailService {
  constructor(
    @Inject('IUsuarioRepositorio') private readonly usuarioRepositorio: IUsuarioRepositorio,
  ) {}

  async confirmarEmail(token: string): Promise<{ message: string }> {
    const usuario = await this.usuarioRepositorio.encontrarPorTokenDeConfirmacion(token);

    if (!usuario) {
      throw new UnauthorizedException('Token de confirmación inválido o expirado.');
    }

    if (usuario.estaVerificado()) {
      return { message: 'Este correo electrónico ya ha sido verificado.' };
    }

    await this.usuarioRepositorio.marcarComoVerificado(usuario.id);

    return { message: 'Correo electrónico verificado con éxito. Ya puedes iniciar sesión.' };
  }
} 