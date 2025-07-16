import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

export type RolUsuario = 'Atleta' | 'Entrenador' | 'Admin';

export class Usuario {
  readonly id: string;
  readonly email: string;
  private passwordHash: string;
  public refreshTokenHash: string | null; // <-- NUEVA PROPIEDAD
  readonly nombre: string;
  readonly rol: RolUsuario;
  readonly createdAt: Date;

  private constructor(props: {
    id: string;
    email: string;
    passwordHash: string;
    refreshTokenHash: string | null;
    nombre: string;
    rol: RolUsuario;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.refreshTokenHash = props.refreshTokenHash;
    this.nombre = props.nombre;
    this.rol = props.rol;
    this.createdAt = props.createdAt;
  }

  public static async crear(props: {
    email: string;
    passwordPlano: string;
    nombre: string;
    rol: RolUsuario;
  }): Promise<Usuario> {
    const id = randomUUID();
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(props.passwordPlano, saltRounds);

    return new Usuario({
      id,
      email: props.email,
      passwordHash,
      refreshTokenHash: null, // Un nuevo usuario no tiene refresh token
      nombre: props.nombre,
      rol: props.rol,
      createdAt: new Date(),
    });
  }

  public static desdePersistencia(props: {
    id: string;
    email: string;
    passwordHash: string;
    refreshTokenHash: string | null;
    nombre: string;
    rol: RolUsuario;
    createdAt: Date;
  }): Usuario {
    return new Usuario(props);
  }

  public obtenerPasswordHash(): string {
    return this.passwordHash;
  }

  public obtenerRefreshTokenHash(): string | null {
    return this.refreshTokenHash;
  }
}
