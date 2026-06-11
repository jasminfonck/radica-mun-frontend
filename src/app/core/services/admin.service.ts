import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Rol           { id: number; nombre: string; descripcion?: string; }
export interface UsuarioOut    { id: number; nombre: string; apellido?: string; email: string; activo: boolean; rol: Rol; created_at: string; }
export interface UsuarioCreate { nombre: string; apellido?: string; email: string; password: string; rol_id: number; }
export interface UsuarioUpdate { nombre?: string; apellido?: string; email?: string; rol_id?: number; activo?: boolean; }
export function nombreCompleto(u: { nombre: string; apellido?: string | null }): string {
  return u.apellido ? `${u.nombre} ${u.apellido}` : u.nombre;
}

export interface EntidadOut {
  id: number; nombre: string; nit?: string; municipio?: string;
  departamento?: string; direccion?: string; telefono?: string;
  email_institucional?: string; configurada: boolean;
}

export interface DependenciaOut { id: number; nombre: string; codigo?: string; responsable?: string; email?: string; activa: boolean; }

export interface CanalOut {
  id: number; nombre: string; tipo: string; activo: boolean;
  config_email?: any; acuse_configurado: boolean;
}
export interface CanalUpdate {
  activo: boolean; config_email?: any; acuse_configurado?: boolean;
}

export interface PlazoOut   { id: number; nombre: string; dias_habiles: number; activo: boolean; }
export interface TipoReqOut {
  id: number; nombre: string; descripcion?: string; activo: boolean;
  plazo_respuesta_id?: number | null;
  plazo_respuesta?: Pick<PlazoOut, 'id' | 'nombre' | 'dias_habiles'> | null;
}

export interface ConfiguracionOut {
  id: number; prefijo_radicado: string; anio_radicado: number;
  secuencia_actual: number; ruta_almacenamiento?: string;
  color_primario: string; sistema_listo: boolean;
  politica_privacidad_activa: boolean; politica_privacidad_texto?: string;
}

export interface BitacoraOut {
  id: number; usuario_nombre: string; accion: string;
  modulo: string; modulo_id?: number; detalle?: string; created_at: string;
}

export interface RespaldoOut {
  generado_en: string; entidad?: any; configuracion?: any;
  dependencias: any[]; canales: any[]; tipos_requerimiento: any[];
  plazos_respuesta: any[]; total_usuarios: number;
}

export interface BuzonCorreoOut {
  id: number;
  canal_id: number;
  proveedor: string;
  correo: string;
  servidor_imap: string;
  puerto: number;
  intervalo_minutos: number;
  max_adjuntos: number;
  max_tamano_adjunto_mb: number;
  activo: boolean;
  ultimo_polling?: string;
  estado_conexion: 'ok' | 'error' | 'sin_probar';
  ultimo_error?: string;
}

export interface BuzonCorreoCreate {
  canal_id: number;
  proveedor: string;
  correo: string;
  password_app: string;
  intervalo_minutos: number;
  max_adjuntos: number;
  max_tamano_adjunto_mb: number;
}

export interface BuzonCorreoUpdate {
  password_app?: string;
  intervalo_minutos?: number;
  max_adjuntos?: number;
  max_tamano_adjunto_mb?: number;
}

export interface TestConexionResult {
  ok: boolean;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = '/api/admin';

  constructor(private http: HttpClient) {}

  // Roles
  getRoles(): Observable<Rol[]> { return this.http.get<Rol[]>(`${this.base}/roles`); }

  // Usuarios
  getUsuarios(): Observable<UsuarioOut[]>                                        { return this.http.get<UsuarioOut[]>(`${this.base}/usuarios`); }
  crearUsuario(d: UsuarioCreate): Observable<UsuarioOut>                         { return this.http.post<UsuarioOut>(`${this.base}/usuarios`, d); }
  actualizarUsuario(id: number, d: UsuarioUpdate): Observable<UsuarioOut>        { return this.http.put<UsuarioOut>(`${this.base}/usuarios/${id}`, d); }

  // Entidad
  getEntidad(): Observable<EntidadOut>                                            { return this.http.get<EntidadOut>(`${this.base}/entidad`); }
  actualizarEntidad(d: Partial<EntidadOut>): Observable<EntidadOut>              { return this.http.put<EntidadOut>(`${this.base}/entidad`, d); }

  // Dependencias
  getDependencias(soloActivas = false): Observable<DependenciaOut[]>             { return this.http.get<DependenciaOut[]>(`${this.base}/dependencias`, { params: { solo_activas: soloActivas } }); }
  crearDependencia(d: Partial<DependenciaOut>): Observable<DependenciaOut>       { return this.http.post<DependenciaOut>(`${this.base}/dependencias`, d); }
  actualizarDependencia(id: number, d: Partial<DependenciaOut>): Observable<DependenciaOut> { return this.http.put<DependenciaOut>(`${this.base}/dependencias/${id}`, d); }

  // Canales
  getCanales(): Observable<CanalOut[]>                                            { return this.http.get<CanalOut[]>(`${this.base}/canales`); }
  actualizarCanal(id: number, d: CanalUpdate): Observable<CanalOut>              { return this.http.put<CanalOut>(`${this.base}/canales/${id}`, d); }

  // Tipos de requerimiento
  getTipos(): Observable<TipoReqOut[]>                                            { return this.http.get<TipoReqOut[]>(`${this.base}/tipos-requerimiento`); }
  crearTipo(d: { nombre: string; descripcion?: string }): Observable<TipoReqOut> { return this.http.post<TipoReqOut>(`${this.base}/tipos-requerimiento`, d); }
  actualizarTipo(id: number, d: Partial<TipoReqOut>): Observable<TipoReqOut>     { return this.http.put<TipoReqOut>(`${this.base}/tipos-requerimiento/${id}`, d); }

  // Plazos
  getPlazos(): Observable<PlazoOut[]>                                             { return this.http.get<PlazoOut[]>(`${this.base}/plazos`); }
  crearPlazo(d: { nombre: string; dias_habiles: number }): Observable<PlazoOut>  { return this.http.post<PlazoOut>(`${this.base}/plazos`, d); }
  actualizarPlazo(id: number, d: Partial<PlazoOut>): Observable<PlazoOut>        { return this.http.put<PlazoOut>(`${this.base}/plazos/${id}`, d); }

  // Configuración
  getConfiguracion(): Observable<ConfiguracionOut>                                { return this.http.get<ConfiguracionOut>(`${this.base}/configuracion`); }
  actualizarConfiguracion(d: Partial<ConfiguracionOut>): Observable<ConfiguracionOut> { return this.http.put<ConfiguracionOut>(`${this.base}/configuracion`, d); }
  getEstadoSistema(): Observable<{ sistema_listo: boolean }>                      { return this.http.get<{ sistema_listo: boolean }>(`${this.base}/sistema/estado`); }

  // Auditoría
  getAuditoria(limite = 200): Observable<BitacoraOut[]>                          { return this.http.get<BitacoraOut[]>(`${this.base}/auditoria`, { params: { limite } }); }

  // Respaldo
  getRespaldo(): Observable<RespaldoOut>                                          { return this.http.get<RespaldoOut>(`${this.base}/respaldo`); }

  // Buzón de correo oficial
  getBuzon(): Observable<BuzonCorreoOut | null>                                   { return this.http.get<BuzonCorreoOut | null>(`${this.base}/buzon-correo`); }
  crearBuzon(d: BuzonCorreoCreate): Observable<BuzonCorreoOut>                   { return this.http.post<BuzonCorreoOut>(`${this.base}/buzon-correo`, d); }
  actualizarBuzon(id: number, d: BuzonCorreoUpdate): Observable<BuzonCorreoOut>  { return this.http.put<BuzonCorreoOut>(`${this.base}/buzon-correo/${id}`, d); }
  probarBuzon(id: number): Observable<TestConexionResult>                         { return this.http.post<TestConexionResult>(`${this.base}/buzon-correo/${id}/probar`, {}); }
  activarBuzon(id: number, activo: boolean): Observable<BuzonCorreoOut>          { return this.http.post<BuzonCorreoOut>(`${this.base}/buzon-correo/${id}/activar`, null, { params: { activo } }); }
}
