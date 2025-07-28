import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IUsuarioRepositorio } from '../../dominio/repositorios/usuario.repositorio';
import { Usuario, RolUsuario } from '../../dominio/entidades/usuario.entity';

@Injectable()
export class InicializacionService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
  ) {}

  /**
   * Inicializa el usuario administrador por defecto si no existe.
   */
  async inicializarUsuarioAdmin(): Promise<void> {
    try {
      const adminEmail = 'admin@capbox.site';
      let admin = await this.usuarioRepositorio.encontrarPorEmail(adminEmail);
      
      if (!admin) {
        console.log('🔧 Creando usuario administrador...');
        
        // Crear usuario admin por defecto
        admin = await Usuario.crear({
          email: adminEmail,
          passwordPlano: 'admin-capbox-2024',
          nombre: 'Administrador CapBox',
          rol: 'Admin' as RolUsuario,
        });
        
        await this.usuarioRepositorio.guardar(admin);
        
        // Marcar como verificado
        await this.usuarioRepositorio.marcarComoVerificado(admin.id);
        
        console.log('✅ Usuario administrador creado exitosamente');
      } else {
        console.log('ℹ️ Usuario administrador ya existe');
        
        // Si el usuario existe pero no está verificado, marcarlo como verificado
        if (!admin.estaVerificado()) {
          await this.usuarioRepositorio.marcarComoVerificado(admin.id);
          console.log('✅ Usuario administrador marcado como verificado');
        }
      }
    } catch (error) {
      console.error('❌ Error al inicializar usuario administrador:', error);
      throw error;
    }
  }
} 