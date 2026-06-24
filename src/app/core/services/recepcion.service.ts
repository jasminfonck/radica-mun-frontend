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
  aviso_adjuntos?: string;
  email_remitente?: string;
  estado: string;
  recibido_por?: UsuarioResumen;
  created_at: string;
  adjuntos: AdjuntoOut[];
}

export interface RecepcionCreate {
  canal_id: number;
  asunto_provisional?: string;
  observaciones?: string;
  email_remitente?: string;
}

export interface BitacoraEvento {
  id: number;
  accion: string;
  entidad?: string;
  entidad_id?: number;
  descripcion?: string;
  ip?: string;
  created_at: string;
  usuario?: { id: number; nombre: string };
}

export interface TipoReqResumen { id: number; nombre: string; }

export interface InfoPublica {
  entidad_nombre: string;
  entidad_municipio?: string;
  entidad_departamento?: string;
  entidad_telefono?: string;
  entidad_email?: string;
  color_primario: string;
  canal_id?: number;
  canal_activo: boolean;
  tipos_requerimiento: TipoReqResumen[];
  politica_privacidad_activa: boolean;
  politica_privacidad_texto?: string;
  max_adjuntos: number;
  max_tamano_adjunto_mb: number;
  tipos_archivo_permitidos: string[];
}

export interface FormularioPublicoCreate {
  tipo_persona: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  tipo_identificacion?: string;
  numero_identificacion?: string;
  digito_verificacion?: string;
  email?: string;
  telefono?: string;
  asunto: string;
  tipo_requerimiento_id?: number | null;
  observaciones?: string;
  acepta_politica: boolean;
}

export interface FormularioPublicoOut {
  recibido: boolean;
  acuse_enviado: boolean;
}

export interface RecepcionFiltros {
  canal_id?: number;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export const ESTADOS_RECEPCION = [
  { value: 'recibido',      label: 'Recibido' },
  { value: 'pendiente',     label: 'Pendiente' },
  { value: 'incompleto',    label: 'Incompleto' },
  { value: 'no_competente', label: 'No competente' },
  { value: 'competente',    label: 'Competente' },
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
    return this.http.post<AdjuntoOut>(
      `${this.base}/${recepcionId}/adjuntos?fase_creacion=true`,
      form,
    );
  }

  descargarAdjunto(recepcionId: number, adjuntoId: number): Observable<Blob> {
    return this.http.get(`${this.base}/${recepcionId}/adjuntos/${adjuntoId}`, { responseType: 'blob' });
  }

  getBitacora(recepcionId: number): Observable<BitacoraEvento[]> {
    return this.http.get<BitacoraEvento[]>(`${this.base}/${recepcionId}/bitacora`);
  }

  notificarAdjuntos(recepcionId: number): Observable<{ enviado: boolean }> {
    return this.http.post<{ enviado: boolean }>(`${this.base}/${recepcionId}/notificar-adjuntos`, {});
  }

  getInfoPublica(): Observable<InfoPublica> {
    return this.http.get<InfoPublica>(`${this.base}/publica/info`);
  }

  crearPublico(data: FormularioPublicoCreate, archivos: File[] = []): Observable<FormularioPublicoOut> {
    const fd = new FormData();
    fd.append('tipo_persona',  data.tipo_persona);
    fd.append('asunto',        data.asunto);
    fd.append('acepta_politica', String(data.acepta_politica));
    if (data.nombres)               fd.append('nombres',               data.nombres);
    if (data.apellidos)             fd.append('apellidos',             data.apellidos);
    if (data.razon_social)          fd.append('razon_social',          data.razon_social);
    if (data.tipo_identificacion)   fd.append('tipo_identificacion',   data.tipo_identificacion);
    if (data.numero_identificacion) fd.append('numero_identificacion', data.numero_identificacion);
    if (data.digito_verificacion)   fd.append('digito_verificacion',   data.digito_verificacion);
    if (data.email)                 fd.append('email',                 data.email);
    if (data.telefono)              fd.append('telefono',              data.telefono);
    if (data.tipo_requerimiento_id != null)
                                    fd.append('tipo_requerimiento_id', String(data.tipo_requerimiento_id));
    if (data.observaciones)         fd.append('observaciones',         data.observaciones);
    archivos.forEach(f => fd.append('adjuntos', f, f.name));
    return this.http.post<FormularioPublicoOut>(`${this.base}/publica`, fd);
  }
}
