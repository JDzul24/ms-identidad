import { Racha } from '../entidades/racha.entity';
import { HistorialRacha } from '../entidades/historial-racha.entity';

export interface IRachaRepositorio {
  guardar(racha: Racha): Promise<Racha>;
  actualizar(racha: Racha): Promise<Racha>;
  encontrarPorUsuarioId(usuarioId: string): Promise<Racha | null>;
  crearOEncontrar(usuarioId: string): Promise<Racha>;
  guardarHistorial(historial: HistorialRacha): Promise<HistorialRacha>;
  encontrarHistorialPorUsuarioId(usuarioId: string): Promise<HistorialRacha[]>;
} 