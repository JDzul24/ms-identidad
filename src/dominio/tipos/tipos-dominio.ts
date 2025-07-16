/**
 * Este archivo centraliza las definiciones de tipos e interfaces compartidas
 * a través de la capa de dominio para evitar dependencias circulares.
 */

/**
 * Define la estructura de los datos que se pueden actualizar en el perfil de un atleta.
 */
export interface PerfilAtletaActualizable {
  nivel: string;
  alturaCm: number;
  pesoKg: number;
  guardia?: string;
  alergias?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
}
