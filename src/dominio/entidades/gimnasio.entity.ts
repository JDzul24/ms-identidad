import { randomUUID } from 'crypto';

export class Gimnasio {
  readonly id: string;
  readonly ownerId: string;
  private _nombre: string;
  private _tamaño: string;
  private _totalBoxeadores: number;
  private _ubicacion: string;
  private _imagenUrl?: string;
  readonly gymKey: string;

  private constructor(props: {
    id: string;
    ownerId: string;
    nombre: string;
    tamaño: string;
    totalBoxeadores: number;
    ubicacion: string;
    imagenUrl?: string;
    gymKey: string;
  }) {
    this.id = props.id;
    this.ownerId = props.ownerId;
    this._nombre = props.nombre;
    this._tamaño = props.tamaño;
    this._totalBoxeadores = props.totalBoxeadores;
    this._ubicacion = props.ubicacion;
    this._imagenUrl = props.imagenUrl;
    this.gymKey = props.gymKey;
  }

  // Getters
  get nombre(): string { return this._nombre; }
  get tamaño(): string { return this._tamaño; }
  get totalBoxeadores(): number { return this._totalBoxeadores; }
  get ubicacion(): string { return this._ubicacion; }
  get imagenUrl(): string | undefined { return this._imagenUrl; }

  // Métodos de actualización
  actualizarNombre(nombre: string): void {
    this._nombre = nombre;
  }

  actualizarTamaño(tamaño: string): void {
    this._tamaño = tamaño;
  }

  actualizarTotalBoxeadores(totalBoxeadores: number): void {
    this._totalBoxeadores = totalBoxeadores;
  }

  actualizarUbicacion(ubicacion: string): void {
    this._ubicacion = ubicacion;
  }

  actualizarImagenUrl(imagenUrl: string): void {
    this._imagenUrl = imagenUrl;
  }

  /**
   * Método de fábrica para crear una nueva instancia de Gimnasio.
   */
  public static crear(props: {
    ownerId: string;
    nombre: string;
    tamaño: string;
    totalBoxeadores: number;
    ubicacion: string;
    imagenUrl?: string;
    gymKey: string;
  }): Gimnasio {
    return new Gimnasio({
      id: randomUUID(),
      ownerId: props.ownerId,
      nombre: props.nombre,
      tamaño: props.tamaño,
      totalBoxeadores: props.totalBoxeadores,
      ubicacion: props.ubicacion,
      imagenUrl: props.imagenUrl,
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
    size?: string;
    totalBoxers?: number;
    location?: string;
    imageUrl?: string;
    gymKey: string;
  }): Gimnasio {
    return new Gimnasio({
      id: props.id,
      ownerId: props.ownerId,
      nombre: props.name,
      tamaño: props.size || 'mediano',
      totalBoxeadores: props.totalBoxers || 0,
      ubicacion: props.location || '',
      imagenUrl: props.imageUrl,
      gymKey: props.gymKey,
    });
  }
}
