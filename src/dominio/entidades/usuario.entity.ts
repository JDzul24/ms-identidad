import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

export type RolUsuario = 'Atleta' | 'Entrenador' | 'Admin';

export interface PerfilAtletaDominio {
  nivel: string | null;
  alturaCm: number | null;
  pesoKg: number | null;
  guardia: string | null;
  alergias: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
}

export interface GimnasioDominio {
  id: string;
  nombre: string;
}

export class Usuario {
  readonly id: string;
  readonly email: string;
  private passwordHash: string | null; // Puede ser nulo si Cognito gestiona la contraseña
  public refreshTokenHash: string | null;
  public fcmToken: string | null;
  readonly nombre: string;
  readonly rol: RolUsuario;
  readonly createdAt: Date;

  public perfilAtleta: PerfilAtletaDominio | null;
  public gimnasio: GimnasioDominio | null;

  private constructor(props: {
    id: string;
    email: string;
    passwordHash: string | null;
    refreshTokenHash: string | null;
    fcmToken: string | null;
    nombre: string;
    rol: RolUsuario;
    createdAt: Date;
    perfilAtleta: PerfilAtletaDominio | null;
    gimnasio: GimnasioDominio | null;
  }) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.refreshTokenHash = props.refreshTokenHash;
    this.fcmToken = props.fcmToken;
    this.nombre = props.nombre;
    this.rol = props.rol;
    this.createdAt = props.createdAt;
    this.perfilAtleta = props.perfilAtleta;
    this.gimnasio = props.gimnasio;
  }

  /**
   * Método de fábrica original, útil para crear usuarios gestionados localmente.
   */
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
      refreshTokenHash: null,
      fcmToken: null,
      nombre: props.nombre,
      rol: props.rol,
      createdAt: new Date(),
      perfilAtleta: null,
      gimnasio: null,
    });
  }
  
  /**
   * --- NUEVO MÉTODO DE FÁBRICA ---
   * Crea una instancia de Usuario cuando la identidad es gestionada por Cognito.
   * Utiliza el ID (sub) de Cognito y no requiere contraseña.
   */
  public static crearSincronizado(props: {
    id: string; // ID (sub) de Cognito
    email: string;
    nombre: string;
    rol: RolUsuario;
  }): Usuario {
    return new Usuario({
      id: props.id,
      email: props.email,
      passwordHash: null, // Cognito gestiona la contraseña, no la almacenamos
      refreshTokenHash: null,
      fcmToken: null,
      nombre: props.nombre,
      rol: props.rol,
      createdAt: new Date(),
      perfilAtleta: null,
      gimnasio: null,
    });
  }

  public static desdePersistencia(props: {
    id: string;
    email: string;
    passwordHash: string | null;
    refreshTokenHash: string | null;
    fcmToken: string | null;
    nombre: string;
    rol: RolUsuario;
    createdAt: Date;
    perfilAtleta: PerfilAtletaDominio | null;
    gimnasio: GimnasioDominio | null;
  }): Usuario {
    return new Usuario(props);
  }

  public obtenerPasswordHash(): string | null {
    return this.passwordHash;
  }

  public obtenerRefreshTokenHash(): string | null {
    return this.refreshTokenHash;
  }
}
