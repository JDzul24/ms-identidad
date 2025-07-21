import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IPublicadorEventos } from '../../aplicacion/ports/publicador-eventos.interface';

@Injectable()
export class NestjsEventEmitter implements IPublicadorEventos {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Publica un evento de dominio utilizando el EventEmitter de NestJS.
   * El nombre del evento se obtiene del nombre de la clase del objeto del evento.
   *
   * @param evento - El objeto del evento de dominio a publicar.
   */
  publicar(evento: any): void {
    // La convención es usar el nombre de la clase del evento como el 'topic'
    // al que se suscribirán los manejadores (@OnEvent).
    this.eventEmitter.emit(evento.constructor.name, evento);
  }
}
