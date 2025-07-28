import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { IGimnasioRepositorio } from '../../dominio/repositorios/gimnasio.repositorio';
import { PerfilUsuarioDto } from '../../infraestructura/dtos/perfil-usuario.dto';
import { Gimnasio } from '../../dominio/entidades/gimnasio.entity';

@Injectable()
export class PerfilUsuarioService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
    @Inject('IGimnasioRepositorio')
    private readonly gimnasioRepositorio: IGimnasioRepositorio,
  ) {}

  /**
   * Obtiene y construye el perfil completo de un usuario por su ID.
   * @param usuarioId El ID del usuario extraído del token JWT.
   * @returns Un DTO con la información completa y estructurada del perfil.
   */
  async ejecutar(usuarioId: string): Promise<PerfilUsuarioDto> {
    const usuario = await this.usuarioRepositorio.encontrarPorId(usuarioId);

    if (!usuario) {
      throw new NotFoundException(
        'El usuario asociado a este token ya no existe.',
      );
    }

    // ✅ AUTO-FIX: Activar coach automáticamente si está pendiente
    if (usuario.rol === 'Entrenador' && usuario.estadoAtleta === 'pendiente_datos') {
      console.log('⚠️ PERFIL: Coach pendiente detectado en /me, activando automáticamente:', usuario.email);
      
      try {
        // Actualizar el estado del coach
        usuario.estadoAtleta = 'activo';
        usuario.datosFisicosCapturados = true;
        
        // Guardar los cambios en la base de datos
        await this.usuarioRepositorio.guardar(usuario);
        
        console.log('✅ PERFIL: Coach activado automáticamente:', usuario.email);
      } catch (error) {
        console.error('❌ PERFIL: Error activando coach automáticamente:', error);
        // Continuar sin fallar la consulta del perfil
      }
    }

    // ✅ AUTO-FIX: Activar admin automáticamente si está pendiente
    if (usuario.rol === 'Admin' && usuario.estadoAtleta === 'pendiente_datos') {
      console.log('⚠️ PERFIL: Admin pendiente detectado en /me, activando automáticamente:', usuario.email);
      
      try {
        // Actualizar el estado del admin
        usuario.estadoAtleta = 'activo';
        usuario.datosFisicosCapturados = true;
        
        // Guardar los cambios en la base de datos
        await this.usuarioRepositorio.guardar(usuario);
        
        console.log('✅ PERFIL: Admin activado automáticamente:', usuario.email);
      } catch (error) {
        console.error('❌ PERFIL: Error activando admin automáticamente:', error);
        // Continuar sin fallar la consulta del perfil
      }
    }

    // ✅ AUTO-FIX: Auto-vinculación de admin si no tiene gimnasio
    if (usuario.rol === 'Admin' && !usuario.gimnasio) {
      console.log('⚠️ PERFIL: Admin sin gimnasio detectado en /me, creando uno por defecto:', usuario.email);
      
      try {
        const nombreGimnasio = `Gimnasio de ${usuario.nombre}`;
        
        const gimnasio = Gimnasio.crear({
          ownerId: usuario.id,
          nombre: nombreGimnasio,
          tamaño: 'mediano',
          totalBoxeadores: 0,
          ubicacion: 'Por definir',
          imagenUrl: null,
          gymKey: this.generarClaveGimnasio(nombreGimnasio),
        });

        const gimnasioGuardado = await this.gimnasioRepositorio.guardar(gimnasio);
        
        // Actualizar el objeto usuario para incluir el gimnasio
        usuario.gimnasio = {
          id: gimnasioGuardado.id,
          nombre: gimnasioGuardado.nombre,
        };
        
        console.log('✅ PERFIL: Gimnasio creado automáticamente para admin:', usuario.email);
      } catch (error) {
        console.error('❌ PERFIL: Error creando gimnasio automáticamente:', error);
        // Continuar sin fallar la consulta del perfil
      }
    }

    // Ahora podemos acceder a las propiedades de forma segura y tipada
    const perfilDto: PerfilUsuarioDto = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,

      gimnasio: usuario.gimnasio
        ? {
            id: usuario.gimnasio.id,
            nombre: usuario.gimnasio.nombre,
          }
        : null,

      perfilAtleta: usuario.perfilAtleta
        ? {
            nivel: usuario.perfilAtleta.nivel,
            alturaCm: usuario.perfilAtleta.alturaCm,
            pesoKg: usuario.perfilAtleta.pesoKg,
            guardia: usuario.perfilAtleta.guardia,
            alergias: usuario.perfilAtleta.alergias,
            contactoEmergenciaNombre:
              usuario.perfilAtleta.contactoEmergenciaNombre,
            contactoEmergenciaTelefono:
              usuario.perfilAtleta.contactoEmergenciaTelefono,
          }
        : null,

      // Nuevos campos para estado del atleta
      estado_atleta: usuario.estadoAtleta || 'pendiente_datos',
      datos_fisicos_capturados: usuario.datosFisicosCapturados || false,
    };

    return perfilDto;
  }

  private generarClaveGimnasio(nombreGimnasio: string): string {
    // Generar clave basada en el nombre del gimnasio
    const nombreLimpio = nombreGimnasio.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const timestamp = Date.now().toString().slice(-3);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    return `${nombreLimpio.slice(0, 3)}${timestamp}${random}`;
  }
}