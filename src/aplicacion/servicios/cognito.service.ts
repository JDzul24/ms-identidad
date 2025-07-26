import { Injectable, InternalServerErrorException, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminCreateUserCommandInput,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider';
import { RolUsuario } from '../../infraestructura/dtos/registrar-usuario.dto';

@Injectable()
export class CognitoService {
  private readonly logger = new Logger(CognitoService.name);
  private readonly cognitoClient: CognitoIdentityProviderClient;
  private readonly userPoolId: string;

  constructor(private readonly configService: ConfigService) {
    // Obtenemos las credenciales y configuración de las variables de entorno.
    this.userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID');
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    // Validamos que todas las variables necesarias estén presentes.
    if (!this.userPoolId || !region || !accessKeyId || !secretAccessKey) {
      this.logger.error('Las variables de entorno de AWS Cognito no están completamente configuradas.');
      throw new InternalServerErrorException('Error de configuración del servicio de autenticación.');
    }

    // Creamos el cliente del SDK de AWS.
    this.cognitoClient = new CognitoIdentityProviderClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Crea un nuevo usuario en el User Pool de Cognito.
   * Utiliza el comando 'AdminCreateUser', que no requiere confirmación por email
   * inmediata, marcando el usuario como confirmado directamente.
   *
   * @param email El email del nuevo usuario (será su username).
   * @param nombre El nombre completo del usuario.
   * @param rol El rol del usuario (Atleta, Entrenador, etc.).
   * @returns El ID del usuario (sub) creado en Cognito.
   */
  async crearUsuarioAdministrativamente(
    email: string,
    nombre: string,
    rol: RolUsuario,
  ): Promise<string> {
    const commandInput: AdminCreateUserCommandInput = {
      UserPoolId: this.userPoolId,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: nombre },
        { Name: 'email_verified', Value: 'true' },
        // Añadimos el rol como un atributo personalizado
        { Name: 'custom:rol', Value: rol },
      ],
      // Cognito marcará el email como verificado y la cuenta como confirmada.
      MessageAction: 'SUPPRESS',
    };

    try {
      const command = new AdminCreateUserCommand(commandInput);
      const response = await this.cognitoClient.send(command);

      if (!response.User?.Attributes) {
        throw new Error('La respuesta de Cognito no incluyó los atributos del usuario.');
      }

      // El 'sub' es el identificador único y permanente del usuario en Cognito.
      const subAttribute = response.User.Attributes.find(
        (attr) => attr.Name === 'sub',
      );

      if (!subAttribute?.Value) {
        throw new Error("No se encontró el atributo 'sub' en la respuesta de Cognito.");
      }

      return subAttribute.Value;

    } catch (error) {
      if (error instanceof UsernameExistsException) {
        // Este error específico es importante manejarlo por separado.
        throw new UnprocessableEntityException('El correo electrónico ya está registrado en el servicio de autenticación.');
      }
      this.logger.error('Error al crear el usuario en Cognito', error);
      throw new InternalServerErrorException('Ocurrió un error al registrar el usuario.');
    }
  }
}
