import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginadoOut } from '../../shared/models/paginacion.model';

export interface RemitenteResumen {
  id: number;
  tipo_persona: string;
  nombre_completo: string;
  numero_identificacion?: string;
  email?: string;
  telefono?: string;
  activo: boolean;
}

export interface RemitenteOut extends RemitenteResumen {
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  nit?: string;
  digito_verificacion?: string;
  tipo_identificacion?: string;
  direccion?: string;
  departamento?: string;
  municipio?: string;
  created_at: string;
}

export interface RemitenteCreate {
  tipo_persona: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  nit?: string;
  digito_verificacion?: string;
  tipo_identificacion?: string;
  numero_identificacion?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  departamento?: string;
  municipio?: string;
}

/** Campos editables — tipo_persona, tipo_identificacion y numero_identificacion son inmutables */
export interface RemitenteUpdate {
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  nit?: string;
  digito_verificacion?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  departamento?: string;
  municipio?: string;
  activo?: boolean;
}

export interface TipoRequerimientoResumen { id: number; nombre: string; }
export interface PlazoRespuestaResumen    { id: number; nombre: string; dias_habiles: number; }

export interface MetadatosOut {
  id: number;
  recepcion_id: number;
  remitente: RemitenteResumen;
  asunto: string;
  tipo_soporte: string;
  numero_anexos: number;
  tipo_requerimiento?: TipoRequerimientoResumen;
  plazo_respuesta?: PlazoRespuestaResumen;
  observaciones?: string;
  numero_referencia?: string;
  fecha_documento?: string;
  campos_bloqueados?: string[];
  created_at: string;
}

export interface MetadatosCreate {
  remitente_id: number;
  asunto: string;
  tipo_soporte: string;
  numero_anexos?: number;
  tipo_requerimiento_id?: number;
  plazo_respuesta_id?: number;
  observaciones?: string;
  numero_referencia?: string;
  fecha_documento?: string;
}

@Injectable({ providedIn: 'root' })
export class RemitenteService {
  private base = '/api/remitente';

  constructor(private http: HttpClient) {}

  buscar(
    q?: string, tipo_persona?: string, soloActivos = true, page = 1, page_size = 20,
  ): Observable<PaginadoOut<RemitenteResumen>> {
    let params = new HttpParams()
      .set('solo_activos', String(soloActivos))
      .set('page', page)
      .set('page_size', page_size);
    if (q)            params = params.set('q', q);
    if (tipo_persona) params = params.set('tipo_persona', tipo_persona);
    return this.http.get<PaginadoOut<RemitenteResumen>>(this.base, { params });
  }

  verificarDuplicados(numero_identificacion?: string, email?: string): Observable<RemitenteResumen[]> {
    let params = new HttpParams();
    if (numero_identificacion) params = params.set('numero_identificacion', numero_identificacion);
    if (email)                 params = params.set('email', email);
    return this.http.get<RemitenteResumen[]>(`${this.base}/duplicados`, { params });
  }

  obtener(id: number): Observable<RemitenteOut> {
    return this.http.get<RemitenteOut>(`${this.base}/${id}`);
  }

  crear(data: RemitenteCreate): Observable<RemitenteOut> {
    return this.http.post<RemitenteOut>(this.base, data);
  }

  actualizar(id: number, data: RemitenteUpdate): Observable<RemitenteOut> {
    return this.http.put<RemitenteOut>(`${this.base}/${id}`, data);
  }

  // ── Metadatos ─────────────────────────────────────────────────────────────

  obtenerMetadatos(recepcionId: number): Observable<MetadatosOut | null> {
    return this.http.get<MetadatosOut | null>(`${this.base}/metadatos/${recepcionId}`);
  }

  guardarMetadatos(recepcionId: number, data: MetadatosCreate): Observable<MetadatosOut> {
    return this.http.post<MetadatosOut>(`${this.base}/metadatos/${recepcionId}`, data);
  }

  actualizarMetadatos(metadatosId: number, data: Partial<MetadatosCreate>): Observable<MetadatosOut> {
    return this.http.put<MetadatosOut>(`${this.base}/metadatos/${metadatosId}`, data);
  }
}
