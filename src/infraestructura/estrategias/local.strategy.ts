import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../aplicacion/servicios/auth.service';
import { Usuario } from '../../dominio/entidades/usuario.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<Usuario> {
    const usuario = await this.authService.validarCredencialesUsuario(email, password);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }
    // --- CORRECCIÓN AQUÍ ---
    // Devolvemos la instancia completa de la clase Usuario.
    // Passport se encargará de adjuntarla al request.
    // La lógica para quitar el password hash se hará al generar el DTO de respuesta, no aquí.
    return usuario;
  }
}
