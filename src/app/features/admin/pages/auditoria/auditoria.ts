import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AdminService, BitacoraOut } from '../../../../core/services/admin.service';
import { ConsultaService, LogAuditoriaOut } from '../../../../core/services/consulta.service';

@Component({
  selector: 'app-auditoria',
  templateUrl: './auditoria.html',
  standalone: false
})
export class AuditoriaComponent implements OnInit {

  // ── Tab 1: Bitácora Admin ─────────────────────────────────────────────────
  registros: BitacoraOut[] = [];
  registrosFiltrados: BitacoraOut[] = [];
  modulosAdmin: string[] = [];
  filtrosAdmin: FormGroup;

  // ── Tab 2: Bitácora Operativa ─────────────────────────────────────────────
  logsOperativos: LogAuditoriaOut[] = [];
  cargandoOperativa = false;
  filtrosOperativa: FormGroup;

  cargando = true;
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
  }

  ngOnInit(): void {
    this.adminService.getAuditoria(500).subscribe({
      next: r => {
        this.registros = r;
        this.registrosFiltrados = r;
        this.modulosAdmin = [...new Set(r.map(x => x.modulo).filter(Boolean))].sort();
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => { this.cargando = false; this.cdr.markForCheck(); },
    });
    this.cargarOperativa();
  }

  // ── Admin filters ─────────────────────────────────────────────────────────

  aplicarFiltrosAdmin(): void {
    const { texto, accion, modulo, fecha_desde, fecha_hasta } = this.filtrosAdmin.value;
    const txtLower = (texto ?? '').toLowerCase().trim();

    const parseFechaLocal = (iso: string, finDia = false): number | null => {
      if (!iso) return null;
      const [y, m, d] = iso.split('-').map(Number);
      return finDia
        ? new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
        : new Date(y, m - 1, d).getTime();
    };

    const desdeMs = parseFechaLocal(fecha_desde);
    const hastaMs = parseFechaLocal(fecha_hasta, true);

    this.registrosFiltrados = this.registros.filter(r => {
      if (accion && r.accion !== accion) return false;
      if (modulo && r.modulo !== modulo) return false;
      const t = new Date(r.created_at).getTime();
      if (desdeMs !== null && t < desdeMs) return false;
      if (hastaMs !== null && t > hastaMs) return false;
      if (txtLower) {
        const hay = [r.usuario_nombre, this.etiquetaAccion(r.accion), r.modulo ?? '', r.detalle ?? '']
          .join(' ').toLowerCase();
        if (!hay.includes(txtLower)) return false;
      }
      return true;
    });
    this.cdr.markForCheck();
  }

  limpiarAdmin(): void {
    this.filtrosAdmin.reset({ texto: '', accion: '', modulo: '', fecha_desde: '', fecha_hasta: '' });
    this.registrosFiltrados = this.registros;
    this.cdr.markForCheck();
  }

  get hayFiltrosAdmin(): boolean {
    const v = this.filtrosAdmin.value;
    return !!(v.texto || v.accion || v.modulo || v.fecha_desde || v.fecha_hasta);
  }

  // ── Operativa ─────────────────────────────────────────────────────────────

  cargarOperativa(): void {
    this.cargandoOperativa = true;
    const { accion, modulo, fecha_desde, fecha_hasta } = this.filtrosOperativa.value;
    const filtros: any = {};
    if (accion)      filtros.accion      = accion;
    if (modulo)      filtros.modulo      = modulo;
    if (fecha_desde) filtros.fecha_desde = fecha_desde;
    if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;

    this.consultaService.logAuditoria(filtros).subscribe({
      next:  l  => { this.logsOperativos = l; this.cargandoOperativa = false; this.cdr.markForCheck(); },
      error: () => { this.cargandoOperativa = false; this.cdr.markForCheck(); },
    });
  }

  limpiarOperativa(): void {
    this.filtrosOperativa.reset({ accion: '', modulo: '', fecha_desde: '', fecha_hasta: '' });
    this.cargarOperativa();
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
