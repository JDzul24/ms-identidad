import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AtletaAprobadoEvento } from '../../dominio/eventos/atleta-aprobado.evento';
import { NotificacionesPushService } from '../../infraestructura/notificaciones/notificaciones-push.service';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';

@Injectable()
export class ManejadorAtletaAprobado {
  private readonly logger = new Logger(ManejadorAtletaAprobado.name);

  constructor(
    private readonly notificacionesService: NotificacionesPushService,
    // Necesitamos el repositorio para obtener datos del atleta,
    // como su token de dispositivo.
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
  ) {}

  /**
   * Este método se ejecuta automáticamente cuando se emite un 'AtletaAprobadoEvento'.
   * @param evento El objeto del evento que contiene el ID del atleta.
   */
  @OnEvent(AtletaAprobadoEvento.name, { async: true })
  async handle(evento: AtletaAprobadoEvento) {
    this.logger.log(
      `Manejando evento AtletaAprobadoEvento para el atleta ID: ${evento.atletaId}`,
    );

    try {
      // 1. Obtener la información completa del atleta desde la base de datos.

      const atleta = await this.usuarioRepositorio.encontrarPorId(
        evento.atletaId,
      );

      if (!atleta) {
        this.logger.error(
          `No se encontró al atleta con ID ${evento.atletaId} para enviar la notificación.`,
        );
        return;
      }
      
      // Asumimos que la entidad Usuario tiene una propiedad 'fcmToken'.
      // Esto requeriría una migración de la base de datos.
      const tokenDispositivo = (atleta as any).fcmToken;

      if (!tokenDispositivo) {
        this.logger.warn(
          `El atleta ${atleta.nombre} no tiene un token de dispositivo registrado. No se puede enviar la notificación.`,
        );
        return;
      }

      // 2. Enviar la notificación push.
      const titulo = '¡Tu cuenta ha sido aprobada!';
      const cuerpo = `¡Felicidades, ${atleta.nombre}! Tu entrenador ha aprobado tu cuenta. Ya puedes empezar a registrar tu rendimiento.`;

      await this.notificacionesService.enviarNotificacion(
        tokenDispositivo,
        titulo,
        cuerpo,
      );
    } catch (error) {
      this.logger.error(
        `Fallo al manejar el evento AtletaAprobadoEvento para el atleta ID: ${evento.atletaId}`,
        error,
      );
    }
  }
}
