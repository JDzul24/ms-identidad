import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PerfilAtletaDominio, GimnasioDominio } from '../tipos/tipos-dominio';

export type RolUsuario = 'Atleta' | 'Entrenador' | 'Admin';

export class Usuario {
  readonly id: string;
  readonly email: string;
  private passwordHash: string | null;
  public refreshTokenHash: string | null;
  public fcmToken: string | null;
  readonly nombre: string;
  readonly rol: RolUsuario;
  readonly createdAt: Date;
  public perfilAtleta: PerfilAtletaDominio | null;
  public gimnasio: GimnasioDominio | null;
  private emailVerificado: boolean;
  public estadoAtleta: string | null;
  public datosFisicosCapturados: boolean;

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
    emailVerificado: boolean;
    estadoAtleta: string | null;
    datosFisicosCapturados: boolean;
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
    this.emailVerificado = props.emailVerificado;
    this.estadoAtleta = props.estadoAtleta;
    this.datosFisicosCapturados = props.datosFisicosCapturados;
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

    // ✅ CORRECCIÓN: ADMINS se crean automáticamente activos
    const estadoAtleta = props.rol === 'Admin' 
      ? 'activo' 
      : 'pendiente_datos';
    
    const datosFisicosCapturados = props.rol === 'Admin';

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
      emailVerificado: false, // Los nuevos usuarios no están verificados
      estadoAtleta,
      datosFisicosCapturados,
    });
  }

  /**
   * --- NUEVO MÉTODO DE FÁBRICA ---
   * Crea una instancia de Usuario a partir de datos sincronizados (ej. de un token).
   * No requiere contraseña.
   */
  public static crearSincronizado(props: {
    id: string;
    email: string;
    nombre: string;
    rol: RolUsuario;
  }): Usuario {
    // ✅ CORRECCIÓN: ADMINS se crean automáticamente activos
    const estadoAtleta = props.rol === 'Admin' 
      ? 'activo' 
      : 'pendiente_datos';
    
    const datosFisicosCapturados = props.rol === 'Entrenador' || props.rol === 'Admin';

    return new Usuario({
      id: props.id,
      email: props.email,
      passwordHash: null, // La contraseña es gestionada por Cognito
      refreshTokenHash: null,
      fcmToken: null,
      nombre: props.nombre,
      rol: props.rol,
      createdAt: new Date(),
      perfilAtleta: null,
      gimnasio: null,
      emailVerificado: true, // Los usuarios sincronizados se asumen verificados
      estadoAtleta,
      datosFisicosCapturados,
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
    emailVerificado: boolean;
    estadoAtleta?: string | null;
    datosFisicosCapturados?: boolean;
  }): Usuario {
    return new Usuario({
      ...props,
      estadoAtleta: props.estadoAtleta || 'pendiente_datos',
      datosFisicosCapturados: props.datosFisicosCapturados || false,
    });
  }

  public estaVerificado(): boolean {
    return this.emailVerificado;
  }

  public obtenerPasswordHash(): string | null {
    return this.passwordHash;
  }

  public obtenerRefreshTokenHash(): string | null {
    return this.refreshTokenHash;
  }
}
