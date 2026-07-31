import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginadoOut } from '../../shared/models/paginacion.model';

export interface ResultadoBusqueda {
  radicado_id:      number;
  numero_radicado:  string;
  recepcion_id:     number;
  fecha_radicacion: string;
  asunto:           string;
  remitente:        string;
  canal:            string;
  dependencia:      string;
  estado_radicado:  string;
  estado_recepcion: string;
  tipo_soporte?:           string | null;
  tipo_requerimiento?:     string | null;
  tipo_persona_remitente?: string | null;
}

export interface ResultadoBusquedaPaginado {
  items:     ResultadoBusqueda[];
  total:     number;
  page:      number;
  page_size: number;
}

export type FormatoExportacion = 'csv' | 'excel' | 'pdf';

export interface ItemConteo { label: string; total: number; }

export interface EstadisticasOut {
  total_recepciones:      number;
  total_radicados:        number;
  radicados_vigentes:     number;
  radicados_anulados:     number;
  por_dependencia:        ItemConteo[];
  por_canal:              ItemConteo[];
  por_mes:                ItemConteo[];
  por_tipo_requerimiento: ItemConteo[];
}

export interface ReporteAgrupadoOut {
  total: number;
  por_canal: ItemConteo[];
  por_dependencia: ItemConteo[];
  por_tipo_requerimiento: ItemConteo[];
}

export interface ResultadoRecepcion {
  recepcion_id: number;
  numero_seguimiento?: string | null;
  fecha_creacion: string;
  asunto: string;
  remitente: string;
  canal: string;
  estado: string;
  tiene_radicado: boolean;
}

export interface ResultadoRecepcionPaginado {
  items:     ResultadoRecepcion[];
  total:     number;
  page:      number;
  page_size: number;
}

export interface ReporteAgrupadoRecepcionesOut {
  total: number;
  por_canal: ItemConteo[];
  por_estado: ItemConteo[];
}

export interface FiltrosRecepciones {
  q?: string;
  canal_id?: number;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  page_size?: number;
}

export interface LogAuditoriaOut {
  id:          number;
  usuario?:    { id: number; nombre: string };
  accion:      string;
  modulo?:     string;
  modulo_id?:  number;
  descripcion?: string;
  ip?:         string;
  created_at:  string;
}

export interface FiltrosBusqueda {
  q?: string;
  numero_radicado?: string;
  canal_id?: number;
  dependencia_id?: number;
  estado_radicado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo_requerimiento_id?: number;
  tipo_soporte?: string;
  tipo_persona?: string;
  page?: number;
  page_size?: number;
}

@Injectable({ providedIn: 'root' })
export class ConsultaService {
  constructor(private http: HttpClient) {}

  private _paramsFiltros(filtros: FiltrosBusqueda): HttpParams {
    let params = new HttpParams();
    if (filtros.q)                      params = params.set('q',                      filtros.q);
    if (filtros.numero_radicado)        params = params.set('numero_radicado',        filtros.numero_radicado);
    if (filtros.canal_id)               params = params.set('canal_id',               filtros.canal_id);
    if (filtros.dependencia_id)         params = params.set('dependencia_id',         filtros.dependencia_id);
    if (filtros.estado_radicado)        params = params.set('estado_radicado',        filtros.estado_radicado);
    if (filtros.fecha_desde)            params = params.set('fecha_desde',            filtros.fecha_desde);
    if (filtros.fecha_hasta)            params = params.set('fecha_hasta',            filtros.fecha_hasta);
    if (filtros.tipo_requerimiento_id)  params = params.set('tipo_requerimiento_id',  filtros.tipo_requerimiento_id);
    if (filtros.tipo_soporte)           params = params.set('tipo_soporte',           filtros.tipo_soporte);
    if (filtros.tipo_persona)           params = params.set('tipo_persona',           filtros.tipo_persona);
    return params;
  }

  buscar(filtros: FiltrosBusqueda = {}): Observable<ResultadoBusquedaPaginado> {
    let params = this._paramsFiltros(filtros);
    params = params.set('page',      filtros.page ?? 1);
    params = params.set('page_size', filtros.page_size ?? 20);
    return this.http.get<ResultadoBusquedaPaginado>('/api/consulta/buscar', { params });
  }

  exportar(filtros: FiltrosBusqueda = {}, formato: FormatoExportacion = 'csv'): void {
    let params = this._paramsFiltros(filtros).set('formato', formato);
    const extensiones: Record<FormatoExportacion, string> = { csv: 'csv', excel: 'xlsx', pdf: 'pdf' };
    this.http.get('/api/consulta/exportar', { params, responseType: 'blob' }).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.download = `radicados_${hoy}.${extensiones[formato]}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  estadisticas(): Observable<EstadisticasOut> {
    return this.http.get<EstadisticasOut>('/api/consulta/estadisticas');
  }

  reporteAgrupado(filtros: FiltrosBusqueda = {}): Observable<ReporteAgrupadoOut> {
    const params = this._paramsFiltros(filtros);
    return this.http.get<ReporteAgrupadoOut>('/api/consulta/reportes/agrupado', { params });
  }

  reporteRemitentesFrecuentes(filtros: FiltrosBusqueda = {}, limite = 15): Observable<ItemConteo[]> {
    const params = this._paramsFiltros(filtros).set('limite', limite);
    return this.http.get<ItemConteo[]>('/api/consulta/reportes/remitentes-frecuentes', { params });
  }

  private _paramsRecepciones(filtros: FiltrosRecepciones): HttpParams {
    let params = new HttpParams();
    if (filtros.q)            params = params.set('q', filtros.q);
    if (filtros.canal_id)     params = params.set('canal_id', filtros.canal_id);
    if (filtros.estado)       params = params.set('estado', filtros.estado);
    if (filtros.fecha_desde)  params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta)  params = params.set('fecha_hasta', filtros.fecha_hasta);
    return params;
  }

  buscarRecepciones(filtros: FiltrosRecepciones = {}): Observable<ResultadoRecepcionPaginado> {
    let params = this._paramsRecepciones(filtros);
    params = params.set('page', filtros.page ?? 1);
    params = params.set('page_size', filtros.page_size ?? 20);
    return this.http.get<ResultadoRecepcionPaginado>('/api/consulta/recepciones/buscar', { params });
  }

  reporteAgrupadoRecepciones(filtros: FiltrosRecepciones = {}): Observable<ReporteAgrupadoRecepcionesOut> {
    const params = this._paramsRecepciones(filtros);
    return this.http.get<ReporteAgrupadoRecepcionesOut>('/api/consulta/recepciones/reportes/agrupado', { params });
  }

  exportarRecepciones(filtros: FiltrosRecepciones = {}, formato: FormatoExportacion = 'csv'): void {
    let params = this._paramsRecepciones(filtros).set('formato', formato);
    const extensiones: Record<FormatoExportacion, string> = { csv: 'csv', excel: 'xlsx', pdf: 'pdf' };
    this.http.get('/api/consulta/recepciones/exportar', { params, responseType: 'blob' }).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.download = `recepciones_${hoy}.${extensiones[formato]}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  logAuditoria(filtros: {
    accion?: string; modulo?: string; usuario_id?: number;
    fecha_desde?: string; fecha_hasta?: string; page?: number; page_size?: number;
  } = {}): Observable<PaginadoOut<LogAuditoriaOut>> {
    let params = new HttpParams()
      .set('page', filtros.page ?? 1)
      .set('page_size', filtros.page_size ?? 20);
    if (filtros.accion)      params = params.set('accion',      filtros.accion);
    if (filtros.modulo)      params = params.set('modulo',      filtros.modulo);
    if (filtros.usuario_id)  params = params.set('usuario_id',  filtros.usuario_id);
    if (filtros.fecha_desde) params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params = params.set('fecha_hasta', filtros.fecha_hasta);
    return this.http.get<PaginadoOut<LogAuditoriaOut>>('/api/auditoria', { params });
  }
}
