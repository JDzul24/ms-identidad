import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificacionesPushService implements OnModuleInit {
  private readonly logger = new Logger(NotificacionesPushService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Inicializa el SDK de Firebase Admin cuando el módulo de NestJS se carga.
   * Carga las credenciales de forma segura desde las variables de entorno.
   */
  onModuleInit() {
    // Obtenemos las credenciales codificadas en base64 desde el entorno.
    const firebaseServiceAccountBase64 = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_BASE64',
    );

    if (!firebaseServiceAccountBase64) {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_BASE64 no está configurado. El servicio de notificaciones push estará deshabilitado.',
      );
      return;
    }

    // Decodificamos la cadena base64 para obtener el JSON de la cuenta de servicio.
    const serviceAccountJson = Buffer.from(
      firebaseServiceAccountBase64,
      'base64',
    ).toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Inicializamos la app de Firebase Admin si no ha sido inicializada antes.
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.logger.log('SDK de Firebase Admin inicializado correctamente.');
    }
  }

  /**
   * Envía una notificación push a un dispositivo específico.
   * @param tokenDispositivo El token de FCM del dispositivo al que se enviará la notificación.
   * @param titulo El título de la notificación.
   * @param cuerpo El cuerpo del mensaje de la notificación.
   */
  async enviarNotificacion(
    tokenDispositivo: string,
    titulo: string,
    cuerpo: string,
  ): Promise<void> {
    if (admin.apps.length === 0) {
      this.logger.error(
        'No se puede enviar la notificación. El SDK de Firebase Admin no está inicializado.',
      );
      return;
    }
    
    // Construimos el mensaje de la notificación.
    const mensaje = {
      notification: {
        title: titulo,
        body: cuerpo,
      },
      token: tokenDispositivo,
      // Opciones adicionales, como el sonido o el ícono
      android: {
        notification: {
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    try {
      const respuesta = await admin.messaging().send(mensaje);
      this.logger.log(
        `Notificación enviada con éxito a ${tokenDispositivo}. Message ID: ${respuesta}`,
      );
    } catch (error) {
      this.logger.error(
        `Error al enviar notificación a ${tokenDispositivo}:`,
        error,
      );
    }
  }
}
