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
        subject: 'Tu código de confirmación para CapBox',
        html: `
          <h1>Bienvenido a CapBox!</h1>
          <p>Gracias por registrarte. Usa el siguiente código para confirmar tu cuenta en la aplicación:</p>
          
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; background-color: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center;">${token}</p>
          
          <p>El código es válido por 15 minutos.</p>
          <p>Si no te registraste, por favor ignora este correo.</p>
        `,
      });
    } catch (error) {
      console.error('Error enviando correo de confirmación:', error);
      // MODIFICACIÓN: Incluir el mensaje de error original para una mejor depuración.
      const errorMessage = error.message || 'Error desconocido de la API de Resend.';
      throw new InternalServerErrorException(
        `Error al intentar enviar el correo de confirmación. Detalle del proveedor: ${errorMessage}`,
      );
    }
  }
} 