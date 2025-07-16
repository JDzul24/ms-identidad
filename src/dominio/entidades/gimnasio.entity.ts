// Esta clase representa un Gimnasio en nuestra lógica de negocio.
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
   * Método estático para reconstituir una entidad Gimnasio desde los datos
   * que vienen de la capa de persistencia (base de datos).
   */
  public static desdePersistencia(props: {
    id: string;
    ownerId: string;
    name: string; // El nombre de la columna en la BD es 'name'
    gymKey: string;
  }): Gimnasio {
    return new Gimnasio({
      id: props.id,
      ownerId: props.ownerId,
      nombre: props.name, // Mapeamos 'name' de la BD a 'nombre' en el dominio
      gymKey: props.gymKey,
    });
  }
}