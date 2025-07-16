/**
 * DTO para representar la información básica de un miembro de un gimnasio.
 */
export class MiembroGimnasioDto {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  nivel?: string; // Solo para atletas
}
