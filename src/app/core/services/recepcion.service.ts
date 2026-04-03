import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdjuntoOut {
  id: number;
  nombre_original: string;
  nombre_archivo: string;
  tipo_mime?: string;
  tamano_bytes?: number;
}

export interface CanalResumen   { id: number; nombre: string; tipo: string; }
export interface UsuarioResumen { id: number; nombre: string; }

export interface RecepcionOut {
  id: number;
  canal: CanalResumen;
  asunto_provisional?: string;
  observaciones?: string;
  estado: string;
  recibido_por?: UsuarioResumen;
  created_at: string;
  adjuntos: AdjuntoOut[];
}

export interface RecepcionCreate {
  canal_id: number;
  asunto_provisional?: string;
  observaciones?: string;
}

export interface RecepcionFiltros {
  canal_id?: number;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export const ESTADOS_RECEPCION = [
  { value: 'recibido',      label: 'Recibido' },
  { value: 'en_revision',   label: 'En revisión' },
  { value: 'pendiente',     label: 'Pendiente' },
  { value: 'incompleto',    label: 'Incompleto' },
  { value: 'incompetente',  label: 'Incompetente' },
];

@Injectable({ providedIn: 'root' })
export class RecepcionService {
  private base = '/api/recepcion';

  constructor(private http: HttpClient) {}

  listar(filtros: RecepcionFiltros = {}): Observable<RecepcionOut[]> {
    let params = new HttpParams();
    if (filtros.canal_id)    params = params.set('canal_id',    filtros.canal_id);
    if (filtros.estado)      params = params.set('estado',      filtros.estado);
    if (filtros.fecha_desde) params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params = params.set('fecha_hasta', filtros.fecha_hasta);
    return this.http.get<RecepcionOut[]>(this.base, { params });
  }

  obtener(id: number): Observable<RecepcionOut> {
    return this.http.get<RecepcionOut>(`${this.base}/${id}`);
  }

  crear(data: RecepcionCreate): Observable<RecepcionOut> {
    return this.http.post<RecepcionOut>(this.base, data);
  }

  actualizar(id: number, data: Partial<RecepcionOut>): Observable<RecepcionOut> {
    return this.http.put<RecepcionOut>(`${this.base}/${id}`, data);
  }

  subirAdjunto(recepcionId: number, archivo: File): Observable<AdjuntoOut> {
    const form = new FormData();
    form.append('archivo', archivo);
    return this.http.post<AdjuntoOut>(`${this.base}/${recepcionId}/adjuntos`, form);
  }

  eliminarAdjunto(recepcionId: number, adjuntoId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${recepcionId}/adjuntos/${adjuntoId}`);
  }
}
