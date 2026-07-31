import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { AdminService, BitacoraOut, LogMensajeEmailOut } from '../../../../core/services/admin.service';
import { ConsultaService, LogAuditoriaOut } from '../../../../core/services/consulta.service';

@Component({
  selector: 'app-auditoria',
  templateUrl: './auditoria.html',
  standalone: false
})
export class AuditoriaComponent implements OnInit {

  // ── Tab 1: Bitácora Admin ─────────────────────────────────────────────────
  registrosAdmin: BitacoraOut[] = [];
  totalAdmin = 0;
  pageIndexAdmin = 0;
  pageSizeAdmin = 20;
  modulosAdmin: string[] = [];
  filtrosAdmin: FormGroup;
  cargandoAdmin = true;

  // ── Tab 2: Bitácora Operativa ─────────────────────────────────────────────
  logsOperativos: LogAuditoriaOut[] = [];
  totalOperativa = 0;
  pageIndexOperativa = 0;
  pageSizeOperativa = 20;
  cargandoOperativa = false;
  filtrosOperativa: FormGroup;

  // ── Tab 3: Log de correos ─────────────────────────────────────────────────
  logEmails: LogMensajeEmailOut[] = [];
  totalEmails = 0;
  pageIndexEmails = 0;
  pageSizeEmails = 20;
  cargandoEmails = false;
  filtrosEmails: FormGroup;
  columnaEmails = ['created_at', 'tipo', 'destinatario', 'asunto', 'estado'];

  columnasAdmin     = ['created_at', 'usuario_nombre', 'accion', 'modulo', 'detalle'];
  columnasOperativa = ['created_at', 'usuario', 'accion', 'modulo', 'descripcion', 'ip'];

  readonly ACCION_LABEL: Record<string, string> = {
    crear_usuario:                 'Crear usuario',
    actualizar_usuario:            'Actualizar usuario',
    actualizar_entidad:            'Actualizar entidad',
    crear_dependencia:             'Crear dependencia',
    actualizar_dependencia:        'Actualizar dependencia',
    actualizar_canal:              'Actualizar canal',
    crear_tipo_requerimiento:      'Crear tipo requerimiento',
    actualizar_tipo_requerimiento: 'Actualizar tipo requerimiento',
    crear_plazo_respuesta:         'Crear plazo respuesta',
    actualizar_plazo_respuesta:    'Actualizar plazo respuesta',
    actualizar_configuracion:      'Actualizar configuración',
    crear_buzon_correo:            'Crear buzón correo',
    actualizar_buzon_correo:       'Actualizar buzón correo',
    activar_buzon_correo:          'Activar buzón correo',
    desactivar_buzon_correo:       'Desactivar buzón correo',
  };

  readonly ACCIONES_OPERATIVAS = [
    { value: '',                        label: 'Todas las acciones' },
    { value: 'crear_recepcion',         label: 'Crear recepción' },
    { value: 'cambio_estado_recepcion', label: 'Cambio estado recepción' },
    { value: 'formulario_publico',      label: 'Formulario web ciudadano' },
    { value: 'envio_acuse_email',       label: 'Acuse por email' },
    { value: 'subir_adjunto',           label: 'Subir adjunto' },
    { value: 'crear_remitente',         label: 'Crear remitente' },
    { value: 'editar_remitente',        label: 'Editar remitente' },
    { value: 'registrar_metadatos',     label: 'Registrar metadatos' },
    { value: 'editar_metadatos',        label: 'Editar metadatos' },
    { value: 'crear_radicado',          label: 'Crear radicado' },
    { value: 'generar_radicado',        label: 'Generar radicado' },
    { value: 'anular_radicado',         label: 'Anular radicado' },
  ];

  readonly MODULOS_OPERATIVOS = [
    { value: '',                   label: 'Todos los módulos' },
    { value: 'recepciones',        label: 'Recepciones' },
    { value: 'radicado',           label: 'Radicados' },
    { value: 'remitentes',         label: 'Remitentes' },
    { value: 'metadatos_recepcion', label: 'Metadatos' },
  ];

  constructor(
    private adminService: AdminService,
    private consultaService: ConsultaService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
  ) {
    this.filtrosAdmin = this.fb.group({
      texto:       [''],
      accion:      [''],
      modulo:      [''],
      fecha_desde: [''],
      fecha_hasta: [''],
    });

    this.filtrosOperativa = this.fb.group({
      accion:      [''],
      modulo:      [''],
      fecha_desde: [''],
      fecha_hasta: [''],
    });

    this.filtrosEmails = this.fb.group({
      recepcion_id: [''],
      fecha_desde:  [''],
      fecha_hasta:  [''],
    });
  }

  ngOnInit(): void {
    this.adminService.getModulosAuditoria().subscribe(m => {
      this.modulosAdmin = m;
      this.cdr.markForCheck();
    });
    this.cargarAdmin();
    this.cargarOperativa();
    this.cargarEmails();
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  private _buscarPaginaAdmin(): void {
    this.cargandoAdmin = true;
    const { texto, accion, modulo, fecha_desde, fecha_hasta } = this.filtrosAdmin.value;
    this.adminService.getAuditoria({
      texto: texto || undefined, accion: accion || undefined, modulo: modulo || undefined,
      fecha_desde: fecha_desde || undefined, fecha_hasta: fecha_hasta || undefined,
      page: this.pageIndexAdmin + 1, page_size: this.pageSizeAdmin,
    }).subscribe({
      next: r => {
        this.registrosAdmin = r.items;
        this.totalAdmin      = r.total;
        this.cargandoAdmin   = false;
        this.cdr.markForCheck();
      },
      error: () => { this.cargandoAdmin = false; this.cdr.markForCheck(); },
    });
  }

  cargarAdmin(): void {
    this.pageIndexAdmin = 0;
    this._buscarPaginaAdmin();
  }

  onPageChangeAdmin(event: PageEvent): void {
    this.pageIndexAdmin = event.pageIndex;
    this.pageSizeAdmin  = event.pageSize;
    this._buscarPaginaAdmin();
  }

  limpiarAdmin(): void {
    this.filtrosAdmin.reset({ texto: '', accion: '', modulo: '', fecha_desde: '', fecha_hasta: '' });
    this.cargarAdmin();
  }

  get hayFiltrosAdmin(): boolean {
    const v = this.filtrosAdmin.value;
    return !!(v.texto || v.accion || v.modulo || v.fecha_desde || v.fecha_hasta);
  }

  // ── Operativa ─────────────────────────────────────────────────────────────

  private _buscarPaginaOperativa(): void {
    this.cargandoOperativa = true;
    const { accion, modulo, fecha_desde, fecha_hasta } = this.filtrosOperativa.value;
    const filtros: any = { page: this.pageIndexOperativa + 1, page_size: this.pageSizeOperativa };
    if (accion)      filtros.accion      = accion;
    if (modulo)      filtros.modulo      = modulo;
    if (fecha_desde) filtros.fecha_desde = fecha_desde;
    if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;

    this.consultaService.logAuditoria(filtros).subscribe({
      next: r => {
        this.logsOperativos = r.items;
        this.totalOperativa  = r.total;
        this.cargandoOperativa = false;
        this.cdr.markForCheck();
      },
      error: () => { this.cargandoOperativa = false; this.cdr.markForCheck(); },
    });
  }

  cargarOperativa(): void {
    this.pageIndexOperativa = 0;
    this._buscarPaginaOperativa();
  }

  onPageChangeOperativa(event: PageEvent): void {
    this.pageIndexOperativa = event.pageIndex;
    this.pageSizeOperativa  = event.pageSize;
    this._buscarPaginaOperativa();
  }

  limpiarOperativa(): void {
    this.filtrosOperativa.reset({ accion: '', modulo: '', fecha_desde: '', fecha_hasta: '' });
    this.cargarOperativa();
  }

  // ── Emails ────────────────────────────────────────────────────────────────

  private _buscarPaginaEmails(): void {
    this.cargandoEmails = true;
    const { recepcion_id } = this.filtrosEmails.value;
    const rid = recepcion_id ? Number(recepcion_id) : undefined;
    this.adminService.getLogEmail(rid, this.pageIndexEmails + 1, this.pageSizeEmails).subscribe({
      next: r => {
        this.logEmails    = r.items;
        this.totalEmails   = r.total;
        this.cargandoEmails = false;
        this.cdr.markForCheck();
      },
      error: () => { this.cargandoEmails = false; this.cdr.markForCheck(); },
    });
  }

  cargarEmails(): void {
    this.pageIndexEmails = 0;
    this._buscarPaginaEmails();
  }

  onPageChangeEmails(event: PageEvent): void {
    this.pageIndexEmails = event.pageIndex;
    this.pageSizeEmails  = event.pageSize;
    this._buscarPaginaEmails();
  }

  limpiarEmails(): void {
    this.filtrosEmails.reset({ recepcion_id: '', fecha_desde: '', fecha_hasta: '' });
    this.cargarEmails();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  etiquetaAccion(accion: string): string {
    return this.ACCION_LABEL[accion] ?? accion;
  }

  detalleResumido(detalle?: string): string {
    if (!detalle) return '—';
    try {
      const obj = JSON.parse(detalle);
      if (obj.nuevo) return Object.entries(obj.nuevo).map(([k, v]) => `${k}: ${v}`).join(', ');
      return detalle.slice(0, 80);
    } catch {
      return detalle.slice(0, 80);
    }
  }
}
