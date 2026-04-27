import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DependenciaResumen { id: number; nombre: string; codigo?: string; }
export interface UsuarioResumen      { id: number; nombre: string; }

export interface RadicadoOut {
  id: number;
  numero_radicado: string;
  recepcion_id: number;
  dependencia: DependenciaResumen;
  radicado_por: UsuarioResumen;
  estado: string;
  observaciones?: string;
  ruta_constancia?: string;
  fecha_radicacion: string;
  created_at: string;
}

export interface RadicadoResumen {
  id: number;
  numero_radicado: string;
  recepcion_id: number;
  dependencia: DependenciaResumen;
  estado: string;
  fecha_radicacion: string;
}

export interface RadicadoCreate {
  recepcion_id:   number;
  dependencia_id: number;
  observaciones?: string;
}

export interface FiltrosRadicado {
  dependencia_id?: number;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

@Injectable({ providedIn: 'root' })
export class RadicadoService {
  private base = '/api/radicado';

  constructor(private http: HttpClient) {}

  listar(filtros: FiltrosRadicado = {}): Observable<RadicadoResumen[]> {
    let params = new HttpParams();
    if (filtros.dependencia_id) params = params.set('dependencia_id', filtros.dependencia_id);
    if (filtros.estado)         params = params.set('estado', filtros.estado);
    if (filtros.fecha_desde)    params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta)    params = params.set('fecha_hasta', filtros.fecha_hasta);
    return this.http.get<RadicadoResumen[]>(this.base, { params });
  }

  obtener(id: number): Observable<RadicadoOut> {
    return this.http.get<RadicadoOut>(`${this.base}/${id}`);
  }

  obtenerPorNumero(numero: string): Observable<RadicadoOut> {
    return this.http.get<RadicadoOut>(`${this.base}/numero/${numero}`);
  }

  obtenerPorRecepcion(recepcionId: number): Observable<RadicadoOut | null> {
    return this.http.get<RadicadoOut | null>(`${this.base}/recepcion/${recepcionId}`);
  }

  crear(data: RadicadoCreate): Observable<RadicadoOut> {
    return this.http.post<RadicadoOut>(this.base, data);
  }

  anular(id: number, observaciones: string): Observable<RadicadoOut> {
    return this.http.put<RadicadoOut>(`${this.base}/${id}/anular`, { observaciones });
  }

  regenerarPdf(id: number): Observable<RadicadoOut> {
    return this.http.post<RadicadoOut>(`${this.base}/${id}/constancia/regenerar`, {});
  }

  descargarConstancia(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/constancia/descargar`, { responseType: 'blob' });
  }
}
