const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function inicializarAdmin() {
  try {
    console.log('🔧 Inicializando usuario administrador...');
    
    const adminEmail = 'admin@capbox.site';
    
    // Verificar si el usuario ya existe
    let admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!admin) {
      console.log('📝 Creando usuario administrador...');
      
      // Generar hash de la contraseña
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash('admin-capbox-2024', saltRounds);
      
      // Crear el usuario administrador
      admin = await prisma.user.create({
        data: {
          id: require('crypto').randomUUID(),
          email: adminEmail,
          password_hash: passwordHash,
          name: 'Administrador CapBox',
          role: 'Admin',
          email_verificado: true, // Marcar como verificado automáticamente
          createdAt: new Date(),
        }
      });
      
      console.log('✅ Usuario administrador creado exitosamente');
      console.log('📧 Email:', admin.email);
      console.log('👤 Nombre:', admin.name);
      console.log('🔑 Rol:', admin.role);
      console.log('✅ Verificado:', admin.email_verificado);
    } else {
      console.log('ℹ️ Usuario administrador ya existe');
      
      // Si existe pero no está verificado, marcarlo como verificado
      if (!admin.email_verificado) {
        await prisma.user.update({
          where: { id: admin.id },
          data: { email_verificado: true }
        });
        console.log('✅ Usuario administrador marcado como verificado');
      }
      
      console.log('📧 Email:', admin.email);
      console.log('👤 Nombre:', admin.name);
      console.log('🔑 Rol:', admin.role);
      console.log('✅ Verificado:', admin.email_verificado);
    }
    
    console.log('\n🔐 Credenciales de acceso:');
    console.log('📧 Email: admin@capbox.site');
    console.log('🔑 Password: admin-capbox-2024');
    console.log('🆔 Client ID: capbox-web-admin');
    console.log('🔐 Client Secret: capbox-web-secret-2024');
    
  } catch (error) {
    console.error('❌ Error al inicializar usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
inicializarAdmin(); 