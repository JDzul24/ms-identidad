import { randomUUID } from 'crypto';

export class Gimnasio {
  readonly id: string;
  readonly ownerId: string;
  readonly nombre: string;
  readonly gymKey: string;

  private constructor(props: {
    id: string;
    ownerId: string;
    nombre: string;
    gymKey: string;
  }) {
    this.id = props.id;
    this.ownerId = props.ownerId;
    this.nombre = props.nombre;
    this.gymKey = props.gymKey;
  }

  /**
   * Método de fábrica para crear una nueva instancia de Gimnasio.
   */
  public static crear(props: {
    ownerId: string;
    nombre: string;
    gymKey: string;
  }): Gimnasio {
    return new Gimnasio({
      id: randomUUID(),
      ownerId: props.ownerId,
      nombre: props.nombre,
      gymKey: props.gymKey,
    });
  }

  /**
   * Método para reconstituir la entidad Gimnasio desde la persistencia.
   */
  public static desdePersistencia(props: {
    id: string;
    ownerId: string;
    name: string; // Prisma usa 'name'
    gymKey: string;
  }): Gimnasio {
    return new Gimnasio({
      id: props.id,
      ownerId: props.ownerId,
      nombre: props.name,
      gymKey: props.gymKey,
    });
  }
}
