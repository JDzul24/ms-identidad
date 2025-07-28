import { Injectable, Inject } from '@nestjs/common';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { Gimnasio } from '../../dominio/entidades/gimnasio.entity';
import { Usuario, RolUsuario } from '../../dominio/entidades/usuario.entity';
import * as bcrypt from 'bcrypt';

export interface FiltrosGimnasio {
  name?: string;
  size?: string;
  minBoxers?: number;
  maxBoxers?: number;
  location?: string;
}

export interface CrearGimnasioDto {
  name: string;
  size: string;
  totalBoxers: number;
  location: string;
  imageUrl?: string;
}

export interface ModificarGimnasioDto {
  name?: string;
  size?: string;
  totalBoxers?: number;
  location?: string;
  imageUrl?: string;
}

@Injectable()
export class GestionGimnasiosService {
  constructor(
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
  ) {}

  async obtenerGimnasios(filtros: FiltrosGimnasio): Promise<any[]> {
    const gimnasios = await this.gimnasioRepositorio.obtenerTodos();
    
    let gimnasiosFiltrados = gimnasios;

    // Aplicar filtros
    if (filtros.name) {
      gimnasiosFiltrados = gimnasiosFiltrados.filter(g => 
        g.nombre.toLowerCase().includes(filtros.name!.toLowerCase())
      );
    }

    if (filtros.size) {
      gimnasiosFiltrados = gimnasiosFiltrados.filter(g => 
        g.tamaño.toLowerCase() === filtros.size!.toLowerCase()
      );
    }

    if (filtros.minBoxers !== undefined) {
      gimnasiosFiltrados = gimnasiosFiltrados.filter(g => 
        g.totalBoxeadores >= filtros.minBoxers!
      );
    }

    if (filtros.maxBoxers !== undefined) {
      gimnasiosFiltrados = gimnasiosFiltrados.filter(g => 
        g.totalBoxeadores <= filtros.maxBoxers!
      );
    }

    if (filtros.location) {
      gimnasiosFiltrados = gimnasiosFiltrados.filter(g => 
        g.ubicacion.toLowerCase().includes(filtros.location!.toLowerCase())
      );
    }

    return gimnasiosFiltrados.map(g => ({
      id: g.id,
      name: g.nombre,
      size: g.tamaño,
      totalBoxers: g.totalBoxeadores,
      location: g.ubicacion,
      imageUrl: g.imagenUrl,
    }));
  }

  async obtenerGimnasioPorId(id: string): Promise<any> {
    const gimnasio = await this.gimnasioRepositorio.encontrarPorId(id);
    
    if (!gimnasio) {
      throw new Error('Gimnasio no encontrado');
    }

    return {
      id: gimnasio.id,
      name: gimnasio.nombre,
      size: gimnasio.tamaño,
      totalBoxers: gimnasio.totalBoxeadores,
      location: gimnasio.ubicacion,
      imageUrl: gimnasio.imagenUrl,
    };
  }

  private async obtenerOcrearUsuarioAdmin(): Promise<string> {
    // Generar un email único para cada gimnasio
    const timestamp = Date.now();
    const adminEmail = `admin-gym-${timestamp}@capbox.site`;
    
    // Crear usuario admin único para este gimnasio
    const admin = await Usuario.crear({
      email: adminEmail,
      passwordPlano: 'admin-capbox-2024',
      nombre: `Administrador Gimnasio ${timestamp}`,
      rol: 'Admin' as RolUsuario,
    });
    
    await this.usuarioRepositorio.guardar(admin);
    
    // Marcar como verificado
    await this.usuarioRepositorio.marcarComoVerificado(admin.id);
    
    return admin.id;
  }

  async crearGimnasio(dto: CrearGimnasioDto): Promise<any> {
    // Obtener o crear usuario admin
    const adminId = await this.obtenerOcrearUsuarioAdmin();
    
    const gimnasio = Gimnasio.crear({
      ownerId: adminId, // Usar el ID del admin real
      nombre: dto.name,
      tamaño: dto.size,
      totalBoxeadores: dto.totalBoxers,
      ubicacion: dto.location,
      imagenUrl: dto.imageUrl,
      gymKey: `GYM-${Date.now()}`, // Generar clave única
    });

    const gimnasioGuardado = await this.gimnasioRepositorio.guardar(gimnasio);

    return {
      id: gimnasioGuardado.id,
      name: gimnasioGuardado.nombre,
      size: gimnasioGuardado.tamaño,
      totalBoxers: gimnasioGuardado.totalBoxeadores,
      location: gimnasioGuardado.ubicacion,
      imageUrl: gimnasioGuardado.imagenUrl,
    };
  }

  async modificarGimnasio(id: string, dto: ModificarGimnasioDto): Promise<any> {
    const gimnasio = await this.gimnasioRepositorio.encontrarPorId(id);
    
    if (!gimnasio) {
      throw new Error('Gimnasio no encontrado');
    }

    // Actualizar solo los campos proporcionados
    if (dto.name !== undefined) {
      gimnasio.actualizarNombre(dto.name);
    }
    if (dto.size !== undefined) {
      gimnasio.actualizarTamaño(dto.size);
    }
    if (dto.totalBoxers !== undefined) {
      gimnasio.actualizarTotalBoxeadores(dto.totalBoxers);
    }
    if (dto.location !== undefined) {
      gimnasio.actualizarUbicacion(dto.location);
    }
    if (dto.imageUrl !== undefined) {
      gimnasio.actualizarImagenUrl(dto.imageUrl);
    }

    const gimnasioActualizado = await this.gimnasioRepositorio.guardar(gimnasio);

    return {
      id: gimnasioActualizado.id,
      name: gimnasioActualizado.nombre,
      size: gimnasioActualizado.tamaño,
      totalBoxers: gimnasioActualizado.totalBoxeadores,
      location: gimnasioActualizado.ubicacion,
      imageUrl: gimnasioActualizado.imagenUrl,
    };
  }

  async eliminarGimnasio(id: string): Promise<{ message: string }> {
    const gimnasio = await this.gimnasioRepositorio.encontrarPorId(id);
    
    if (!gimnasio) {
      throw new Error('Gimnasio no encontrado');
    }

    // Eliminar primero las relaciones de usuarios
    await this.gimnasioRepositorio.eliminarRelacionesUsuarios(id);
    
    // Luego eliminar el gimnasio
    await this.gimnasioRepositorio.eliminar(id);

    return { message: 'Gimnasio eliminado exitosamente.' };
  }
} 