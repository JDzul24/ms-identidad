/**
 * Interfaz que define el contrato para un servicio que puede publicar eventos de dominio.
 * Este es un "puerto" en la terminología de Arquitectura Hexagonal/Puertos y Adaptadores.
 */
export interface IPublicadorEventos {
  /**
   * Publica un evento de dominio para que sea manejado por los suscriptores correspondientes.
   * @param evento El objeto del evento de dominio a publicar.
   *               Utilizamos 'any' aquí para que la interfaz sea genérica y pueda
   *               publicar cualquier tipo de evento, no solo 'AtletaAprobadoEvento'.
   */
  publicar(evento: any): void;
}
