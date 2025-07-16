import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

// --- Controladores ---
import { AuthController } from './infraestructura/controladores/auth.controller';
import { OauthController } from './infraestructura/controladores/oauth.controller';
import { UsuariosController } from './infraestructura/controladores/usuarios.controller';
import { SolicitudesController } from './infraestructura/controladores/solicitudes.controller';
import { AtletasController } from './infraestructura/controladores/atletas.controller';
import { GimnasiosController } from './infraestructura/controladores/gimnasios.controller';

// --- Servicios de Aplicación ---
import { AuthService } from './aplicacion/servicios/auth.service';
import { RegistroUsuarioService } from './aplicacion/servicios/registro-usuario.service';
import { PerfilUsuarioService } from './aplicacion/servicios/perfil-usuario.service';
import { ConsultarSolicitudesService } from './aplicacion/servicios/consultar-solicitudes.service';
import { AprobarAtletaService } from './aplicacion/servicios/aprobar-atleta.service';
import { ConsultarMiembrosService } from './aplicacion/servicios/consultar-miembros.service';

// --- Estrategias y Guardias ---
import { LocalStrategy } from './infraestructura/estrategias/local.strategy';
import { JwtStrategy } from './infraestructura/estrategias/jwt.strategy';
import { JwtRefreshStrategy } from './infraestructura/estrategias/jwt-refresh.strategy';
import { JwtAuthGuard } from './infraestructura/guardias/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './infraestructura/guardias/jwt-refresh-auth.guard';

// --- Infraestructura de Base de Datos ---
import { PrismaService } from './infraestructura/db/prisma.service';
import { PrismaGimnasioRepositorio } from './infraestructura/db/prisma-gimnasio.repositorio';
import { PrismaUsuarioRepositorio } from './infraestructura/db/prisma-usuario.repositorio';
import { PrismaSolicitudRepositorio } from './infraestructura/db/prisma-solicitud.repositorio';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION'),
        },
      }),
    }),
  ],
  controllers: [
    AuthController,
    OauthController,
    UsuariosController,
    SolicitudesController,
    AtletasController,
    GimnasiosController,
  ],
  providers: [
    // Servicios de Aplicación
    AuthService,
    RegistroUsuarioService,
    PerfilUsuarioService,
    ConsultarSolicitudesService,
    AprobarAtletaService,
    ConsultarMiembrosService,

    // Estrategias y Guardias (ahora locales y correctamente provistas)
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    JwtRefreshAuthGuard,

    // Infraestructura de Base de Datos
    PrismaService,
    {
      provide: 'IUsuarioRepositorio',
      useClass: PrismaUsuarioRepositorio,
    },
    {
      provide: 'IGimnasioRepositorio',
      useClass: PrismaGimnasioRepositorio,
    },
    {
      provide: 'ISolicitudRepositorio',
      useClass: PrismaSolicitudRepositorio,
    },
  ],
})
export class MsIdentidadModule {}
