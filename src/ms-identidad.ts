import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventEmitter2 } from 'eventemitter2';

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
import { ObtenerClaveGimnasioService } from './aplicacion/servicios/obtener-clave-gimnasio.service';
import { VincularGimnasioService } from './aplicacion/servicios/vincular-gimnasio.service';
import { ModificarClaveGimnasioService } from './aplicacion/servicios/modificar-clave-gimnasio.service';

// --- Manejadores de Eventos ---
import { ManejadorAtletaAprobado } from './aplicacion/manejadores/manejador-atleta-aprobado';

// --- Estrategias y Guardias ---
import { LocalStrategy } from './infraestructura/estrategias/local.strategy';
import { JwtStrategy } from './infraestructura/estrategias/jwt.strategy';
import { JwtRefreshStrategy } from './infraestructura/estrategias/jwt-refresh.strategy';
import { JwtAuthGuard } from './infraestructura/guardias/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './infraestructura/guardias/jwt-refresh-auth.guard';

// --- Infraestructura ---
import { PrismaService } from './infraestructura/db/prisma.service';
import { PrismaGimnasioRepositorio } from './infraestructura/db/prisma-gimnasio.repositorio';
import { PrismaUsuarioRepositorio } from './infraestructura/db/prisma-usuario.repositorio';
import { PrismaSolicitudRepositorio } from './infraestructura/db/prisma-solicitud.repositorio';
import { NotificacionesPushService } from './infraestructura/notificaciones/notificaciones-push.service';
import { NestjsEventEmitter } from './infraestructura/eventos/nestjs-event-emitter';

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
    // Se inicializa el módulo de eventos para toda la aplicación.
    EventEmitterModule.forRoot(),
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
    ObtenerClaveGimnasioService,
    VincularGimnasioService, 
    ModificarClaveGimnasioService,

    // Manejadores de Eventos
    ManejadorAtletaAprobado,

    // Estrategias y Guardias
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    JwtRefreshAuthGuard,

    // Infraestructura
    PrismaService,
    NotificacionesPushService,
    {
      provide: 'IPublicadorEventos',
      useClass: NestjsEventEmitter,   
    },
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
