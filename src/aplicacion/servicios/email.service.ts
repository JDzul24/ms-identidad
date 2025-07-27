import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured in environment variables.');
    }
    this.resend = new Resend(apiKey);
  }

  async sendConfirmationEmail(email: string, token: string) {
    const confirmationLink = `${this.configService.get<string>('FRONTEND_URL')}/confirm-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev', // <-- CAMBIO CLAVE PARA PRUEBA
        to: [email],
        subject: 'Confirma tu cuenta en CapBox',
        html: `
          <h1>Bienvenido a CapBox!</h1>
          <p>Gracias por registrarte. Por favor, confirma tu cuenta usando el siguiente token:</p>
          <h2>${token}</h2>
          <p>O haz clic en el siguiente enlace:</p>
          <a href="${confirmationLink}">Confirmar mi cuenta</a>
          <p>Si no te registraste, por favor ignora este correo.</p>
        `,
      });
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      throw new Error('Could not send confirmation email.');
    }
  }
} 