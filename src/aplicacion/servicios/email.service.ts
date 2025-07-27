import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'RESEND_API_KEY no está configurado en las variables de entorno.',
      );
    }
    this.resend = new Resend(apiKey);

    this.frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!this.frontendUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_URL no está configurada en las variables de entorno.',
      );
    }
  }

  async sendConfirmationEmail(email: string, token: string) {
    const confirmationLink = `${this.frontendUrl}/confirm-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: 'CapBox <no-reply@capbox.site>',
        to: [email],
        subject: 'Confirma tu cuenta en CapBox',
        html: `
          <h1>Bienvenido a CapBox!</h1>
          <p>Gracias por registrarte. Por favor, confirma tu cuenta haciendo clic en el siguiente enlace:</p>
          <a href="${confirmationLink}">Confirmar mi cuenta</a>
          <p>El enlace es válido por 1 hora.</p>
          <p>Si no te registraste, por favor ignora este correo.</p>
        `,
      });
    } catch (error) {
      console.error('Error enviando correo de confirmación:', error);
      throw new InternalServerErrorException(
        'No se pudo enviar el correo de confirmación.',
      );
    }
  }
} 