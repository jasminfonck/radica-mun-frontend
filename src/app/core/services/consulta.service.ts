import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConsultaPublicaOut {
  numero_radicado:   string;
  fecha_radicacion:  string;
  asunto:            string;
  dependencia:       string;
  canal:             string;
  estado_radicado:   string;
  estado_recepcion:  string;
  tipo_soporte:      string;
  remitente:         string;
  url_constancia?:   string | null;
}

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
}

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
}

@Injectable({ providedIn: 'root' })
export class ConsultaService {
  constructor(private http: HttpClient) {}

  consultaPublica(numero: string): Observable<ConsultaPublicaOut> {
    return this.http.get<ConsultaPublicaOut>(`/api/consulta/publica/${numero}`);
  }

  buscar(filtros: FiltrosBusqueda = {}): Observable<ResultadoBusqueda[]> {
    let params = new HttpParams();
    if (filtros.q)               params = params.set('q',               filtros.q);
    if (filtros.numero_radicado) params = params.set('numero_radicado', filtros.numero_radicado);
    if (filtros.canal_id)        params = params.set('canal_id',        filtros.canal_id);
    if (filtros.dependencia_id)  params = params.set('dependencia_id',  filtros.dependencia_id);
    if (filtros.estado_radicado) params = params.set('estado_radicado', filtros.estado_radicado);
    if (filtros.fecha_desde)     params = params.set('fecha_desde',     filtros.fecha_desde);
    if (filtros.fecha_hasta)     params = params.set('fecha_hasta',     filtros.fecha_hasta);
    return this.http.get<ResultadoBusqueda[]>('/api/consulta/buscar', { params });
  }

  exportarCsv(filtros: FiltrosBusqueda = {}): void {
    let params = new HttpParams();
    if (filtros.q)               params = params.set('q',               filtros.q);
    if (filtros.numero_radicado) params = params.set('numero_radicado', filtros.numero_radicado);
    if (filtros.canal_id)        params = params.set('canal_id',        filtros.canal_id);
    if (filtros.dependencia_id)  params = params.set('dependencia_id',  filtros.dependencia_id);
    if (filtros.estado_radicado) params = params.set('estado_radicado', filtros.estado_radicado);
    if (filtros.fecha_desde)     params = params.set('fecha_desde',     filtros.fecha_desde);
    if (filtros.fecha_hasta)     params = params.set('fecha_hasta',     filtros.fecha_hasta);
    this.http.get('/api/consulta/exportar', { params, responseType: 'blob' }).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.download = `radicados_${hoy}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  estadisticas(): Observable<EstadisticasOut> {
    return this.http.get<EstadisticasOut>('/api/consulta/estadisticas');
  }

  logAuditoria(filtros: { accion?: string; modulo?: string; usuario_id?: number; fecha_desde?: string; fecha_hasta?: string } = {}): Observable<LogAuditoriaOut[]> {
    let params = new HttpParams();
    if (filtros.accion)      params = params.set('accion',      filtros.accion);
    if (filtros.modulo)      params = params.set('modulo',      filtros.modulo);
    if (filtros.usuario_id)  params = params.set('usuario_id',  filtros.usuario_id);
    if (filtros.fecha_desde) params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params = params.set('fecha_hasta', filtros.fecha_hasta);
    return this.http.get<LogAuditoriaOut[]>('/api/auditoria', { params });
  }
}
